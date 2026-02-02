// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./PromptToken.sol";

/**
 * @title PromptMarketplace
 * @notice Main marketplace for trading prompts and managing breeding
 * @dev Handles trading logic, fee distribution, and breeding mechanics
 */
contract PromptMarketplace is ReentrancyGuard, Pausable, AccessControl {
    // Roles
    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    // Fee structure (in basis points, 10000 = 100%)
    uint256 public constant CREATOR_FEE = 5000;      // 50%
    uint256 public constant PROTOCOL_FEE = 4000;     // 40%
    uint256 public constant VALIDATOR_FEE = 1000;    // 10%
    uint256 public constant TOTAL_FEE = 10000;       // 100%
    
    // Constants
    uint256 public constant MIN_PRICE = 0.01 ether;
    uint256 public constant MAX_TRADE_SIZE = 100 ether;
    uint256 public constant BREEDING_COOLDOWN = 24 hours;
    uint256 public constant MIN_QUALITY_FOR_BREEDING = 60;
    
    // State
    address public protocolFeeRecipient;
    uint256 public totalTradeVolume;
    uint256 public totalFeeCollected;
    
    // Mappings
    mapping(address => uint256) public userTradeCount;
    mapping(address => uint256) public lastBreedingTime;
    mapping(address => mapping(address => uint256)) public userTokenBalance;
    mapping(bytes32 => bool) public executedTransactions;
    
    // Events
    event PromptTokenCreated(address indexed token, address indexed creator, string promptId);
    event TokensPurchased(address indexed buyer, address indexed token, uint256 amount, uint256 price);
    event TokensSold(address indexed seller, address indexed token, uint256 amount, uint256 price);
    event BreedingExecuted(address indexed parent1, address indexed parent2, address indexed child);
    event FeeDistributed(address indexed token, uint256 creatorFee, uint256 protocolFee, uint256 validatorFee);
    event PriceUpdated(address indexed token, uint256 newPrice);

    constructor(address _protocolFeeRecipient) {
        require(_protocolFeeRecipient != address(0), "Invalid fee recipient");
        protocolFeeRecipient = _protocolFeeRecipient;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @notice Create new prompt token
     * @param _name Token name
     * @param _symbol Token symbol
     * @param _promptId Unique prompt ID
     * @param _qualityScore Quality score (1-100)
     * @return Token address
     */
    function createPromptToken(
        string memory _name,
        string memory _symbol,
        string memory _promptId,
        uint8 _qualityScore
    ) external returns (address) {
        PromptToken token = new PromptToken(
            _name,
            _symbol,
            msg.sender,
            _promptId,
            _qualityScore
        );
        
        token.setMarketplace(address(this));
        
        emit PromptTokenCreated(address(token), msg.sender, _promptId);
        return address(token);
    }

    /**
     * @notice Buy tokens
     * @param _token Token address
     * @param _amount Amount to buy
     * @param _maxPrice Maximum price willing to pay
     */
    function buyTokens(
        address _token,
        uint256 _amount,
        uint256 _maxPrice
    ) external payable nonReentrant whenNotPaused {
        require(_token != address(0), "Invalid token");
        require(_amount > 0, "Amount must be > 0");
        require(_amount <= 100, "Max 100 tokens per tx");
        require(msg.value >= _amount * _maxPrice, "Insufficient payment");
        
        PromptToken token = PromptToken(_token);
        uint256 totalCost = _amount * _maxPrice;
        
        // Transfer tokens to buyer
        require(token.transfer(msg.sender, _amount), "Token transfer failed");
        
        // Distribute fees
        _distributeFees(_token, totalCost);
        
        userTradeCount[msg.sender]++;
        totalTradeVolume += totalCost;
        
        emit TokensPurchased(msg.sender, _token, _amount, _maxPrice);
        
        // Refund excess
        if (msg.value > totalCost) {
            (bool success, ) = msg.sender.call{value: msg.value - totalCost}("");
            require(success, "Refund failed");
        }
    }

    /**
     * @notice Sell tokens
     * @param _token Token address
     * @param _amount Amount to sell
     * @param _minPrice Minimum price willing to accept
     */
    function sellTokens(
        address _token,
        uint256 _amount,
        uint256 _minPrice
    ) external nonReentrant whenNotPaused {
        require(_token != address(0), "Invalid token");
        require(_amount > 0, "Amount must be > 0");
        
        PromptToken token = PromptToken(_token);
        uint256 totalPrice = _amount * _minPrice;
        
        require(totalPrice <= MAX_TRADE_SIZE, "Trade size too large");
        require(address(this).balance >= totalPrice, "Insufficient marketplace balance");
        
        // Transfer tokens from seller to marketplace
        require(token.transferFrom(msg.sender, address(this), _amount), "Token transfer failed");
        
        // Distribute fees
        _distributeFees(_token, totalPrice);
        
        // Pay seller
        (bool success, ) = msg.sender.call{value: totalPrice}("");
        require(success, "Payment failed");
        
        userTradeCount[msg.sender]++;
        totalTradeVolume += totalPrice;
        
        emit TokensSold(msg.sender, _token, _amount, _minPrice);
    }

    /**
     * @notice Breed two prompts (create hybrid)
     * @param _parent1 Parent 1 token address
     * @param _parent2 Parent 2 token address
     * @param _childName Child token name
     * @param _childSymbol Child token symbol
     * @param _childPromptId Child prompt ID
     * @return Child token address
     */
    function breedPrompts(
        address _parent1,
        address _parent2,
        string memory _childName,
        string memory _childSymbol,
        string memory _childPromptId
    ) external nonReentrant whenNotPaused returns (address) {
        require(_parent1 != address(0) && _parent2 != address(0), "Invalid parents");
        require(_parent1 != _parent2, "Cannot breed with same parent");
        require(
            block.timestamp >= lastBreedingTime[msg.sender] + BREEDING_COOLDOWN,
            "Breeding cooldown active"
        );
        
        PromptToken parent1 = PromptToken(_parent1);
        PromptToken parent2 = PromptToken(_parent2);
        
        // Check quality requirements
        require(parent1.qualityScore() >= MIN_QUALITY_FOR_BREEDING, "Parent 1 quality too low");
        require(parent2.qualityScore() >= MIN_QUALITY_FOR_BREEDING, "Parent 2 quality too low");
        
        // Calculate child quality (average of parents)
        uint8 childQuality = uint8((uint256(parent1.qualityScore()) + uint256(parent2.qualityScore())) / 2);
        
        // Create child token
        PromptToken childToken = new PromptToken(
            _childName,
            _childSymbol,
            msg.sender,
            _childPromptId,
            childQuality
        );
        
        childToken.setMarketplace(address(this));
        
        // Update breeding cooldown
        lastBreedingTime[msg.sender] = block.timestamp;
        
        emit BreedingExecuted(_parent1, _parent2, address(childToken));
        
        return address(childToken);
    }

    /**
     * @notice Distribute fees from transaction
     * @param _token Token address
     * @param _amount Total transaction amount
     */
    function _distributeFees(address _token, uint256 _amount) internal {
        uint256 creatorFee = (_amount * CREATOR_FEE) / TOTAL_FEE;
        uint256 protocolFee = (_amount * PROTOCOL_FEE) / TOTAL_FEE;
        uint256 validatorFee = (_amount * VALIDATOR_FEE) / TOTAL_FEE;
        
        // Send protocol fee
        (bool success, ) = protocolFeeRecipient.call{value: protocolFee}("");
        require(success, "Protocol fee transfer failed");
        
        totalFeeCollected += protocolFee;
        
        emit FeeDistributed(_token, creatorFee, protocolFee, validatorFee);
    }

    /**
     * @notice Update quality score (only validators)
     * @param _token Token address
     * @param _newScore New quality score
     */
    function updateTokenQuality(address _token, uint8 _newScore) external onlyRole(VALIDATOR_ROLE) {
        require(_token != address(0), "Invalid token");
        PromptToken(_token).updateQualityScore(_newScore);
        emit PriceUpdated(_token, _newScore);
    }

    /**
     * @notice Pause marketplace
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause marketplace
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @notice Emergency withdrawal (only admin)
     */
    function emergencyWithdraw() external onlyRole(ADMIN_ROLE) {
        uint256 balance = address(this).balance;
        (bool success, ) = msg.sender.call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    /**
     * @notice Receive ETH
     */
    receive() external payable {}
}
