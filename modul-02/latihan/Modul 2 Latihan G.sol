// SPDX-License-Identifier: MIT
// Author: Jason Yapri
// Website: https://jasonyapri.com
// LinkedIn: https://linkedin.com/in/jasonyapri
// Pelita Bangsa Academy - Bootcamp Blockchain Developer Last Cohort - Latihan G
pragma solidity ^0.8.0;

contract DynamicArrayExample {
    // Dynamic Array
    uint[] public dynamicArray;

    // Adding elements to a dynamic array
    function addElement(uint element) external {
        dynamicArray.push(element);
    }

    // Removing the last element from a dynamic array
    function removeLastElement() external {
        dynamicArray.pop();
    }

    // Getting the length of the dynamic array
    function getLength() external view returns (uint) {
        return dynamicArray.length;
    }
}

