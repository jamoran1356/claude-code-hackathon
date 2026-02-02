// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title PromptToken
 * @notice ERC20 token for each prompt in PromptMind marketplace
 * @dev Each prompt gets its own token with fixed 1000 supply
 */
contract PromptToken is ERC20, Ownable, Pausable {
    // Prompt metadata
    uint256 public constant INITIAL_SUPPLY = 1000;
    string public promptId;
    address public marketplace;
    
    // Quality score (1-100)
    uint8 public qualityScore;
    
    // Creator info
    address public creator;
    uint256 public createdAt;
    
    event QualityScoreUpdated(uint8 newScore);
    event MarketplaceUpdated(address indexed newMarketplace);

    /**
     * @notice Initialize prompt token
     * @param _name Token name
     * @param _symbol Token symbol
     * @param _creator Creator address
     * @param _promptId Unique prompt identifier
     * @param _qualityScore Initial quality score (1-100)
     */
    constructor(
        string memory _name,
        string memory _symbol,
        address _creator,
        string memory _promptId,
        uint8 _qualityScore
    ) ERC20(_name, _symbol) Ownable(msg.sender) {
        require(_qualityScore > 0 && _qualityScore <= 100, "Invalid quality score");
        require(_creator != address(0), "Invalid creator");
        
        creator = _creator;
        promptId = _promptId;
        qualityScore = _qualityScore;
        createdAt = block.timestamp;
        
        // Mint initial supply to creator
        _mint(_creator, INITIAL_SUPPLY * 10 ** decimals());
    }

    /**
     * @notice Set marketplace contract address
     * @param _marketplace Marketplace contract address
     */
    function setMarketplace(address _marketplace) external onlyOwner {
        require(_marketplace != address(0), "Invalid marketplace");
        marketplace = _marketplace;
        emit MarketplaceUpdated(_marketplace);
    }

    /**
     * @notice Update quality score (only by marketplace)
     * @param _newScore New quality score
     */
    function updateQualityScore(uint8 _newScore) external {
        require(msg.sender == marketplace, "Only marketplace can update score");
        require(_newScore > 0 && _newScore <= 100, "Invalid quality score");
        qualityScore = _newScore;
        emit QualityScoreUpdated(_newScore);
    }

    /**
     * @notice Pause token transfers
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause token transfers
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Override transfer to respect pause
     */
    function _update(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        super._update(from, to, amount);
    }

    /**
     * @notice Get token circulating supply
     */
    function circulatingSupply() external view returns (uint256) {
        return totalSupply() - balanceOf(creator);
    }
}
