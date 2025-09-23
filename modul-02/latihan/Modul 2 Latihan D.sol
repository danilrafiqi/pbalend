

// SPDX-License-Identifier: MIT
// Author: Jason Yapri
// Website: https://jasonyapri.com
// LinkedIn: https://linkedin.com/in/jasonyapri
// Pelita Bangsa Academy - Bootcamp Blockchain Developer Last Cohort - Latihan D
pragma solidity ^0.8.0;

contract MySmartContract {
    enum MyEnum {
        Value1,
        Vlaue2
    }

    uint256 myUintVariable = 1;
    int256 myIntVariable = -1;

    MyEnum myEnumVariable = MyEnum.Value1;

    bool myBooleanVariable = true;

    address myAddressVariable = address(0);

    bytes8 myBytesVariable = 0x1234567890abcdef;

    string myStringVariable = "testString";
}

