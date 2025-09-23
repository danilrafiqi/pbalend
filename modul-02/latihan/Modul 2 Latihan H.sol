// SPDX-License-Identifier: MIT
// Author: Jason Yapri
// Website: https://jasonyapri.com
// LinkedIn: https://linkedin.com/in/jasonyapri
// Pelita Bangsa Academy - Bootcamp Blockchain Developer Last Cohort - Latihan H
pragma solidity ^0.8.0;

contract MappingExample {
    // A mapping from addresses to balances
    mapping(address => uint256) public balances;

    // Function to update the balance of an address
    function updateBalance(address user, uint256 newBalance) external {
        balances[user] = newBalance;
    }

    // Function to get the balance of an address
    function getBalance(address user) external view returns (uint256) {
        return balances[user];
    }
}

