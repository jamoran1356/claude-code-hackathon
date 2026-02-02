// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @notice Interface for PromptToken
 */
interface IPromptToken {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function totalSupply() external view returns (uint256);
    function qualityScore() external view returns (uint8);
    function updateQualityScore(uint8 _newScore) external;
    function setMarketplace(address _marketplace) external;
}

/**
 * @notice Interface for PromptMarketplace
 */
interface IPromptMarketplace {
    function buyTokens(
        address _token,
        uint256 _amount,
        uint256 _maxPrice
    ) external payable;

    function sellTokens(
        address _token,
        uint256 _amount,
        uint256 _minPrice
    ) external;

    function breedPrompts(
        address _parent1,
        address _parent2,
        string memory _childName,
        string memory _childSymbol,
        string memory _childPromptId
    ) external returns (address);

    function createPromptToken(
        string memory _name,
        string memory _symbol,
        string memory _promptId,
        uint8 _qualityScore
    ) external returns (address);
}

/**
 * @notice Interface for MultiSigWallet
 */
interface IMultiSigWallet {
    function submitTransaction(
        address _to,
        uint256 _value,
        bytes memory _data
    ) external;

    function confirmTransaction(uint256 _txIndex) external;

    function executeTransaction(uint256 _txIndex) external;

    function revokeConfirmation(uint256 _txIndex) external;
}

/**
 * @notice Interface for AuditLog
 */
interface IAuditLog {
    enum EventType {
        TOKEN_CREATED,
        TOKEN_PURCHASED,
        TOKEN_SOLD,
        BREEDING_EXECUTED,
        QUALITY_UPDATED,
        MARKETPLACE_ACTION,
        SECURITY_EVENT
    }

    function log(
        EventType _eventType,
        address _actor,
        address _token,
        string memory _details,
        bytes memory _data
    ) external;

    function flagSuspicious(uint256 _logIndex, string memory _reason) external;
}
