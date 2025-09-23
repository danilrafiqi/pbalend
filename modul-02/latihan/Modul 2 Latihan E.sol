// SPDX-License-Identifier: MIT
// Author: Jason Yapri
// Website: https://jasonyapri.com
// LinkedIn: https://linkedin.com/in/jasonyapri
// Pelita Bangsa Academy - Bootcamp Blockchain Developer Last Cohort - Latihan E
pragma solidity ^0.8.0;

contract MySmartContract {
    uint number;

    function getBalance() external view returns (uint) {
        return address(this).balance;
    }

    function addNumbers(uint a, uint b) internal pure returns (uint) {
        return a + b;
    }

    function store (uint256 num) external {
        number = num;
    }
}

