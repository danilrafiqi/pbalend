// SPDX-License-Identifier: MIT
// Author: Jason Yapri
// Website: https://jasonyapri.com
// LinkedIn: https://linkedin.com/in/jasonyapri
// Pelita Bangsa Academy - Bootcamp Blockchain Developer Last Cohort - Latihan F
pragma solidity ^0.8.0;

contract ArrayExample {
    // Fixed-size array of 3 elements
    uint[3] public fixedArray;

    // Settings values of a fixed-size array
    function setFixedArray() external {
        fixedArray[0] = 10;
        fixedArray[1] = 20;
        fixedArray[2] = 30;
    }
}

