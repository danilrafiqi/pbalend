// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IFlashLoanReceiver
 * @dev Interface for receiving flash loan callbacks
 * @notice Contracts that want to receive flash loans must implement this interface
 */
interface IFlashLoanReceiver {
    /**
     * @dev Callback function called by PBALend after token transfer
     * @param token Address of the borrowed token
     * @param amount Amount of token borrowed
     * @param fee Flash loan fee (percentage of amount)
     * @param data Custom data for borrowing logic
     * @return True if successful, False if failed
     *
     * IMPORTANT: In this function, the receiver MUST:
     * 1. Use the borrowed token for specific operations
     * 2. Approve PBALend to take token + fee
     * 3. Ensure token + fee is returned before transaction ends
     *
     * If token + fee is not returned, the entire transaction will REVERT
     */
    function executeOperation(
        address token,
        uint256 amount,
        uint256 fee,
        bytes calldata data
    ) external returns (bool);
}
