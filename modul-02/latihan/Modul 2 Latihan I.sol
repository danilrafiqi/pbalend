// SPDX-License-Identifier: MIT
// Author: Jason Yapri
// Website: https://jasonyapri.com
// LinkedIn: https://linkedin.com/in/jasonyapri
// Pelita Bangsa Academy - Bootcamp Blockchain Developer Last Cohort - Latihan I
pragma solidity ^0.8.0;

contract StructExample {
    // Define a Struct
    struct User {
        string name;
        uint age;
        address account;
    }

    // State variable of type User
    User public user;

    function setUser(string calldata _name, uint _age, address _account) external {
        user = User(_name, _age, _account);
    }

    // Function to retrieve user's data
    function getUser() external view returns (string memory, uint, address) {
        return (user.name, user.age, user.account);
    }
}

