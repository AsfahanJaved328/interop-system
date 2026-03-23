// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/// @title Allowlist for tokens/contracts
contract AllowList is AccessControl {
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");

    mapping(address => bool) public allowed;

    event Allowed(address indexed target, bool status);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MANAGER_ROLE, admin);
    }

    function setAllowed(address target, bool status) external onlyRole(MANAGER_ROLE) {
        allowed[target] = status;
        emit Allowed(target, status);
    }

    function isAllowed(address target) external view returns (bool) {
        return allowed[target];
    }
}
