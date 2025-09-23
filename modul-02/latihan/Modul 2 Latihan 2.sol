// SPDX-License-Identifier: MIT
// Author: Jason Yapri
// Website: https://jasonyapri.com
// LinkedIn: https://linkedin.com/in/jasonyapri
// Pelita Bangsa Academy - Bootcamp Blockchain Developer Last Cohort - Latihan 2
pragma solidity ^0.8.0;

contract Exercise2 {
    struct Box {
        uint256 width;
        uint256 length;
        uint256 height;
    }

    Box[] boxes;

    function addBox(uint256 width, uint256 length, uint256 height) external {
        boxes.push(Box(width, length, height));
    }
}