// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/// @title Upgrade manager (MVP hook for proxies)
contract UpgradeManager is AccessControl {
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    event Upgraded(address indexed proxy, address indexed implementation);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(UPGRADER_ROLE, admin);
    }

    function upgradeProxy(address proxy, address implementation) external onlyRole(UPGRADER_ROLE) {
        (bool ok, ) = proxy.call(abi.encodeWithSignature("upgradeTo(address)", implementation));
        require(ok, "upgrade failed");
        emit Upgraded(proxy, implementation);
    }
}
