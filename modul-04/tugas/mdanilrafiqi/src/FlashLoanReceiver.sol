// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {IFlashLoanReceiver} from "./interfaces/IFlashLoanReceiver.sol";

/**
 * @title FlashLoanReceiver
 * @dev Example flash loan receiver implementation
 * @notice This is a template for creating a flash loan receiver contract
 */
contract FlashLoanReceiver is IFlashLoanReceiver {
    
    address public immutable lendingPool;
    
    constructor(address _lendingPool) {
        lendingPool = _lendingPool;
    }
    
    /**
     * @dev executeOperation implementation
     * @param token The borrowed token
     * @param amount The amount of token borrowed
     * @param fee Flash loan fee
     * @param data Custom data for operation
     */
    function executeOperation(
        address token,
        uint256 amount,
        uint256 fee,
        bytes calldata data
    ) external override returns (bool) {
        // STEP 1: Perform operations with the borrowed token
        // Example: swap, arbitrage, liquidation, etc.
        // ... your logic here ...
        
        uint256 amountOwed = amount + fee;
        
        // STEP 2: Approve lending pool to take token + fee
        IERC20(token).approve(lendingPool, amountOwed);

        // STEP 3: Ensure contract has enough tokens to pay
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance >= amountOwed, "Insufficient balance to repay flash loan");
        
        return true;
    }
}
