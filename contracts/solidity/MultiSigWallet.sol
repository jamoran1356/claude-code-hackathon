// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MultiSigWallet
 * @notice 3-of-5 multi-signature wallet for fund protection
 * @dev Requires 3 signatures for any transaction
 */
contract MultiSigWallet {
    // Events
    event Deposit(address indexed sender, uint256 amount, uint256 balance);
    event SubmitTransaction(
        address indexed owner,
        uint256 indexed txIndex,
        address indexed to,
        uint256 value,
        bytes data
    );
    event ConfirmTransaction(address indexed owner, uint256 indexed txIndex);
    event RevokeConfirmation(address indexed owner, uint256 indexed txIndex);
    event ExecuteTransaction(address indexed owner, uint256 indexed txIndex);

    // State variables
    address[] public owners;
    mapping(address => bool) public isOwner;
    uint256 public required;
    
    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
        uint256 numConfirmations;
        uint256 submittedAt;
        uint256 executeAfter; // Time lock
    }

    Transaction[] public transactions;
    mapping(uint256 => mapping(address => bool)) public isConfirmed;
    
    // Time lock (24 hours)
    uint256 public constant TIME_LOCK = 24 hours;
    uint256 public constant MAX_OWNERS = 5;

    modifier onlyOwner() {
        require(isOwner[msg.sender], "Not owner");
        _;
    }

    modifier txExists(uint256 _txIndex) {
        require(_txIndex < transactions.length, "Tx does not exist");
        _;
    }

    modifier notExecuted(uint256 _txIndex) {
        require(!transactions[_txIndex].executed, "Tx already executed");
        _;
    }

    modifier notConfirmed(uint256 _txIndex) {
        require(!isConfirmed[_txIndex][msg.sender], "Tx already confirmed");
        _;
    }

    /**
     * @notice Initialize multi-sig wallet
     * @param _owners Array of owner addresses
     * @param _required Number of required confirmations
     */
    constructor(address[] memory _owners, uint256 _required) {
        require(_owners.length > 0, "Owners required");
        require(_owners.length <= MAX_OWNERS, "Too many owners");
        require(
            _required > 0 && _required <= _owners.length,
            "Invalid number of required confirmations"
        );

        for (uint256 i = 0; i < _owners.length; i++) {
            address owner = _owners[i];

            require(owner != address(0), "Invalid owner");
            require(!isOwner[owner], "Owner not unique");

            isOwner[owner] = true;
            owners.push(owner);
        }

        required = _required;
    }

    /**
     * @notice Submit a transaction
     * @param _to Recipient address
     * @param _value Amount in wei
     * @param _data Transaction data
     */
    function submitTransaction(
        address _to,
        uint256 _value,
        bytes memory _data
    ) public onlyOwner {
        uint256 txIndex = transactions.length;

        transactions.push(
            Transaction({
                to: _to,
                value: _value,
                data: _data,
                executed: false,
                numConfirmations: 0,
                submittedAt: block.timestamp,
                executeAfter: block.timestamp + TIME_LOCK
            })
        );

        emit SubmitTransaction(msg.sender, txIndex, _to, _value, _data);
    }

    /**
     * @notice Confirm transaction
     * @param _txIndex Transaction index
     */
    function confirmTransaction(uint256 _txIndex)
        public
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
        notConfirmed(_txIndex)
    {
        isConfirmed[_txIndex][msg.sender] = true;
        transactions[_txIndex].numConfirmations += 1;
        emit ConfirmTransaction(msg.sender, _txIndex);
    }

    /**
     * @notice Execute transaction (after time lock and required confirmations)
     * @param _txIndex Transaction index
     */
    function executeTransaction(uint256 _txIndex)
        public
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
    {
        require(
            transactions[_txIndex].numConfirmations >= required,
            "Cannot execute transaction"
        );
        require(
            block.timestamp >= transactions[_txIndex].executeAfter,
            "Time lock not reached"
        );

        Transaction storage transaction = transactions[_txIndex];
        transaction.executed = true;

        (bool success, ) = transaction.to.call{value: transaction.value}(
            transaction.data
        );
        require(success, "Tx failed");

        emit ExecuteTransaction(msg.sender, _txIndex);
    }

    /**
     * @notice Revoke confirmation
     * @param _txIndex Transaction index
     */
    function revokeConfirmation(uint256 _txIndex)
        public
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
    {
        require(isConfirmed[_txIndex][msg.sender], "Tx not confirmed");

        isConfirmed[_txIndex][msg.sender] = false;
        transactions[_txIndex].numConfirmations -= 1;

        emit RevokeConfirmation(msg.sender, _txIndex);
    }

    /**
     * @notice Get number of owners
     */
    function getOwnerCount() public view returns (uint256) {
        return owners.length;
    }

    /**
     * @notice Get transaction count
     */
    function getTransactionCount() public view returns (uint256) {
        return transactions.length;
    }

    /**
     * @notice Get transaction details
     */
    function getTransaction(uint256 _txIndex)
        public
        view
        returns (
            address to,
            uint256 value,
            bytes memory data,
            bool executed,
            uint256 numConfirmations,
            uint256 executeAfter
        )
    {
        Transaction storage transaction = transactions[_txIndex];
        return (
            transaction.to,
            transaction.value,
            transaction.data,
            transaction.executed,
            transaction.numConfirmations,
            transaction.executeAfter
        );
    }

    /**
     * @notice Receive ETH
     */
    receive() external payable {
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }
}
