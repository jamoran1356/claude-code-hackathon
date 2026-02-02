// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AuditLog
 * @notice Immutable audit log for compliance and security
 * @dev All events are logged and cannot be deleted
 */
contract AuditLog {
    // Event types
    enum EventType {
        TOKEN_CREATED,
        TOKEN_PURCHASED,
        TOKEN_SOLD,
        BREEDING_EXECUTED,
        QUALITY_UPDATED,
        MARKETPLACE_ACTION,
        SECURITY_EVENT
    }

    // Audit log entry
    struct LogEntry {
        uint256 timestamp;
        EventType eventType;
        address indexed actor;
        address indexed token;
        string details;
        bytes data;
        bool suspicious;
    }

    // State
    LogEntry[] public logs;
    mapping(address => uint256[]) public userLogs;
    mapping(address => uint256[]) public tokenLogs;
    
    address public admin;
    
    // Events
    event LogCreated(uint256 indexed logIndex, EventType eventType, address indexed actor);
    event SuspiciousActivityDetected(uint256 indexed logIndex, string reason);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    /**
     * @notice Log an event
     * @param _eventType Type of event
     * @param _actor Address performing action
     * @param _token Token involved (if any)
     * @param _details Description of event
     * @param _data Additional data
     */
    function log(
        EventType _eventType,
        address _actor,
        address _token,
        string memory _details,
        bytes memory _data
    ) external {
        require(_actor != address(0), "Invalid actor");

        uint256 logIndex = logs.length;

        LogEntry memory entry = LogEntry({
            timestamp: block.timestamp,
            eventType: _eventType,
            actor: _actor,
            token: _token,
            details: _details,
            data: _data,
            suspicious: false
        });

        logs.push(entry);
        userLogs[_actor].push(logIndex);
        
        if (_token != address(0)) {
            tokenLogs[_token].push(logIndex);
        }

        emit LogCreated(logIndex, _eventType, _actor);
    }

    /**
     * @notice Mark entry as suspicious
     * @param _logIndex Log index
     * @param _reason Reason for suspicion
     */
    function flagSuspicious(uint256 _logIndex, string memory _reason) external onlyAdmin {
        require(_logIndex < logs.length, "Invalid log index");
        logs[_logIndex].suspicious = true;
        emit SuspiciousActivityDetected(_logIndex, _reason);
    }

    /**
     * @notice Get log entry
     * @param _logIndex Log index
     */
    function getLog(uint256 _logIndex)
        external
        view
        returns (
            uint256 timestamp,
            EventType eventType,
            address actor,
            address token,
            string memory details,
            bool suspicious
        )
    {
        require(_logIndex < logs.length, "Invalid log index");
        LogEntry storage entry = logs[_logIndex];
        return (
            entry.timestamp,
            entry.eventType,
            entry.actor,
            entry.token,
            entry.details,
            entry.suspicious
        );
    }

    /**
     * @notice Get user logs
     * @param _user User address
     */
    function getUserLogs(address _user) external view returns (uint256[] memory) {
        return userLogs[_user];
    }

    /**
     * @notice Get token logs
     * @param _token Token address
     */
    function getTokenLogs(address _token) external view returns (uint256[] memory) {
        return tokenLogs[_token];
    }

    /**
     * @notice Get total log count
     */
    function getLogCount() external view returns (uint256) {
        return logs.length;
    }

    /**
     * @notice Get logs in range
     * @param _start Start index
     * @param _count Number of logs to return
     */
    function getLogsBatch(uint256 _start, uint256 _count)
        external
        view
        returns (LogEntry[] memory)
    {
        require(_start < logs.length, "Invalid start");
        require(_count > 0, "Invalid count");

        uint256 end = _start + _count > logs.length ? logs.length : _start + _count;
        LogEntry[] memory result = new LogEntry[](end - _start);

        for (uint256 i = _start; i < end; i++) {
            result[i - _start] = logs[i];
        }

        return result;
    }

    /**
     * @notice Change admin (only current admin)
     * @param _newAdmin New admin address
     */
    function changeAdmin(address _newAdmin) external onlyAdmin {
        require(_newAdmin != address(0), "Invalid admin");
        admin = _newAdmin;
    }
}
