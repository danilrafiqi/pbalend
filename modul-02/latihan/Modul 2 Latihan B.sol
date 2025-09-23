// SPDX-License-Identifier: MIT
// Author: Jason Yapri
// Website: https://jasonyapri.com
// LinkedIn: https://linkedin.com/in/jasonyapri
// Pelita Bangsa Academy - Bootcamp Blockchain Developer Last Cohort - Latihan B
pragma solidity ^0.8.0;

contract Counter {
    uint256 public number;

    function increment() external {
        number = number + 1;
    }

    function decrement() external {
        number = number - 1;
    }
}