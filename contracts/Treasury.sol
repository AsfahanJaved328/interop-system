// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title Treasury (MVP)
contract Treasury is AccessControl {
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");

    event Distributed(address indexed to, uint256 amount);
    event DistributedToken(address indexed token, address indexed to, uint256 amount);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(DISTRIBUTOR_ROLE, admin);
    }

    function distribute(address payable to, uint256 amount) external onlyRole(DISTRIBUTOR_ROLE) {
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "transfer failed");
        emit Distributed(to, amount);
    }

    function distributeToken(address token, address to, uint256 amount) external onlyRole(DISTRIBUTOR_ROLE) {
        IERC20(token).transfer(to, amount);
        emit DistributedToken(token, to, amount);
    }

    receive() external payable {}
}
