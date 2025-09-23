// SPDX-License-Identifier: MIT
// Author: Jason Yapri
// Website: https://jasonyapri.com
// LinkedIn: https://linkedin.com/in/jasonyapri
// Pelita Bangsa Academy - Bootcamp Blockchain Developer Last Cohort - Latihan 1
pragma solidity ^0.8.0;

contract Exercise1 {
    uint256 number;

    function store(uint256 num) external {
        uint256 newNumber = calculateSum(number, num);
        number = newNumber;
    }

    function retrieve() external view returns (uint256) {
        return number;
    }

    function calculateSum(uint256 a, uint256 b) internal pure returns (uint256) {
        return a + b;
    }
}