// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {IPythOracle} from "./interfaces/IPythOracle.sol";
import {IERC20Metadata} from "../lib/openzeppelin-contracts/contracts/token/ERC20/extensions/IERC20Metadata.sol";

/**
 * @title PBALend - Simple Lending Protocol for Learning
 * @dev A comprehensive lending protocol that demonstrates core Solidity concepts
 * @notice This contract allows users to create markets, lend tokens, and borrow against collateral
 */
contract PBALend {
    
    // =============================================================================
    // ERRORS - Custom errors are gas efficient and provide better debugging
    // =============================================================================
    
    error MarketAlreadyExists();
    error MarketDoesNotExist();
    error InsufficientBalance();
    error InsufficientLiquidity();
    error InvalidAmount();
    error TransferFailed();
    error MarketNotActive();
    error InsufficientCollateral();
    error InsufficientShares();

    // =============================================================================
    // EVENTS - Essential for frontend integration and transaction tracking
    // =============================================================================
    
    event MarketCreated(
        address indexed loanToken,
        address indexed collateralToken,
        uint256 interestRate,
        uint256 LTV
    );
    
    event Deposit(
        address indexed loanToken,
        address indexed collateralToken,
        address indexed user,
        uint256 amount,
        uint256 shares
    );

    event Borrow(
        address indexed loanToken,
        address indexed collateralToken,
        address indexed user,
        uint256 amount,
        uint256 shares,
        uint256 collateralAmount
    );
    
    event Repay(
        address indexed loanToken,
        address indexed collateralToken,
        address indexed user,
        uint256 shares,
        uint256 amount
    );
    
    event Withdraw(
        address indexed loanToken,
        address indexed collateralToken,
        address indexed user,
        uint256 amount,
        uint256 shares
    );

    event WithdrawCollateral(
        address indexed loanToken,
        address indexed collateralToken,
        address indexed user,
        uint256 amount
    );
    
    event MarketStatusSet(
        address indexed loanToken,
        address indexed collateralToken,
        bool isActive
    );

    event FlashLoan(
        address indexed token,
        address indexed user,
        uint256 amount
    );
    
    // =============================================================================
    // STRUCTS - Custom data types for organizing complex data
    // =============================================================================
    
    struct MarketData {
        address loanToken;
        address collateralToken;
        bool isActive;
        uint256 interestRate;
        uint256 LTV;
        address oracle;
        uint256 totalDepositShares;
        uint256 totalDepositAssets;
        uint256 totalBorrowShares;
        uint256 totalBorrowAssets;
        uint256 lastAccrueTime;
    }
    
    struct UserData {
        uint256 depositShares;
        uint256 borrowShares;
        uint256 collateralAssets;
    }
    
    // =============================================================================
    // STATE VARIABLES - Contract's persistent storage
    // =============================================================================
    
    // Mapping from token address to its market data
    mapping(bytes32 => MarketData) public marketDatas;
    
    // Nested mapping: user address => token address => user's account data
    mapping(address => mapping(bytes32 => UserData)) public userDatas;
    
    // Constants for calculations
    uint256 public constant PERCENTAGE_DENOMINATOR = 100e16; // 100% = 100e16
    
    /**
     * @dev Ensures the market exists and is active
     */
    modifier marketExists(address token, address collateralToken) {
        if (!marketDatas[_getMarketKey(token, collateralToken)].isActive) revert MarketDoesNotExist();
        _;
    }
    
    /**
     * @dev Validates that amount is greater than zero
     */
    modifier validAmount(uint256 amount) {
        if (amount == 0) revert InvalidAmount();
        _;
    }
    
    // =============================================================================
    // CONSTRUCTOR - Initialization code that runs once when contract is deployed
    // =============================================================================
    
    constructor() {}
    
    // =============================================================================
    // MARKET MANAGEMENT FUNCTIONS
    // =============================================================================
    
    function createMarket(
        address token,
        address collateralToken,
        uint256 interestRate,
        uint256 LTV,
        address oracle
    ) external {
        // Validation checks
        if (marketDatas[_getMarketKey(token, collateralToken)].isActive) revert MarketAlreadyExists();
        if (interestRate > PERCENTAGE_DENOMINATOR) revert InvalidAmount(); // Cannot exceed 100%
        if (LTV > PERCENTAGE_DENOMINATOR) revert InvalidAmount(); // Cannot exceed 100%
        
        // Create the market
        marketDatas[_getMarketKey(token, collateralToken)] = MarketData({
            loanToken: token,
            collateralToken: collateralToken,
            isActive: true,
            interestRate: interestRate,
            LTV: LTV,
            oracle: oracle,
            totalDepositShares: 0,
            totalDepositAssets: 0,
            totalBorrowShares: 0,
            totalBorrowAssets: 0,
            lastAccrueTime: block.timestamp
        });
        
        emit MarketCreated(token, collateralToken, interestRate, LTV);
    }
    
    // =============================================================================
    // LENDING (DEPOSIT) FUNCTIONS
    // =============================================================================
    
    function deposit(address loanToken, address collateralToken, uint256 amount) 
        external 
        marketExists(loanToken, collateralToken) 
        validAmount(amount)
    {
        MarketData storage marketData = marketDatas[_getMarketKey(loanToken, collateralToken)];
        UserData storage userData = userDatas[msg.sender][_getMarketKey(loanToken, collateralToken)];
        
        // Update interest before modifying balances
        _accrueInterest(loanToken, collateralToken);

        uint256 shares = 0;
        if (marketData.totalDepositShares == 0) {
            shares = amount;
        } else {
            shares = amount * marketData.totalDepositShares / marketData.totalDepositAssets;
        }
        
        // Update user's account
        userData.depositShares += shares;
        
        // Update market totals
        marketData.totalDepositShares += shares;
        marketData.totalDepositAssets += amount;

        // Transfer tokens from user to contract
        IERC20(loanToken).transferFrom(msg.sender, address(this), amount);
        
        emit Deposit(loanToken, collateralToken, msg.sender, amount, shares);
    }
    
    // =============================================================================
    // BORROWING FUNCTIONS
    // =============================================================================
    
    function borrow(address loanToken, address collateralToken, uint256 amount, uint256 collateralAmount) 
        external 
        marketExists(loanToken, collateralToken) 
        validAmount(amount)
    {
        MarketData storage marketData = marketDatas[_getMarketKey(loanToken, collateralToken)];
        UserData storage userData = userDatas[msg.sender][_getMarketKey(loanToken, collateralToken)];
        
        // Update interest before calculations
        _accrueInterest(loanToken, collateralToken);

        userData.collateralAssets += collateralAmount;

        // Transfer tokens from user to contract
        IERC20(collateralToken).transferFrom(msg.sender, address(this), collateralAmount);

        uint256 shares = 0;
        if (marketData.totalBorrowShares == 0) {
            shares = amount;
        } else {
            shares = amount * marketData.totalBorrowShares / marketData.totalBorrowAssets;
        }

        // Update user's borrowed amount
        userData.borrowShares += shares;
        
        // Update market totals
        marketData.totalBorrowShares += shares;
        marketData.totalBorrowAssets += amount;
        
        // Check if user has sufficient collateral
        _isHealthy(loanToken, collateralToken, msg.sender);
        if (marketData.totalBorrowAssets > marketData.totalDepositAssets) revert InsufficientLiquidity();

        // Transfer tokens to user
        IERC20(loanToken).transfer(msg.sender, amount);
        
        emit Borrow(loanToken, collateralToken, msg.sender, amount, shares, collateralAmount);
    }
    
    // =============================================================================
    // REPAYMENT FUNCTIONS
    // =============================================================================
    
    function repay(address loanToken, address collateralToken, uint256 amount) 
        external 
        marketExists(loanToken, collateralToken) 
        validAmount(amount) 
    {
        //TODO: Implement repay function
    }
    
    // =============================================================================
    // WITHDRAWAL FUNCTIONS
    // =============================================================================
    
    function withdraw(address loanToken, address collateralToken, uint256 shares) 
        external 
        marketExists(loanToken, collateralToken) 
        validAmount(shares) 
    {
        //TODO: Implement Withdraw Function
    }

    function withdrawCollateral(address loanToken, address collateralToken, uint256 amount) 
        external 
        marketExists(loanToken, collateralToken) 
        validAmount(amount) 
    {
        //TODO: Implement Withdraw Collateral Function
    }

    // =============================================================================
    // ADDITIONAL FUNCTIONS
    // =============================================================================
    
    function flashLoan(address token, uint256 amount, bytes calldata data) external {
        //TODO: Implement Flash Loan Function
    }

    // =============================================================================
    // INTERNAL HELPER FUNCTIONS
    // =============================================================================

    function _getMarketKey(address loanToken, address collateralToken) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(loanToken, collateralToken));
    }
    
    function _accrueInterest(address loanToken, address collateralToken) internal {
        MarketData storage marketData = marketDatas[_getMarketKey(loanToken, collateralToken)];
        uint256 interestPerYear = marketData.interestRate * marketData.totalBorrowAssets / PERCENTAGE_DENOMINATOR;

        uint256 timeElapsed = block.timestamp - marketData.lastAccrueTime;
        if (timeElapsed == 0) return;

        uint256 interestAccrued = interestPerYear * timeElapsed / 365 days;

        marketData.totalDepositAssets += interestAccrued;
        marketData.totalBorrowAssets += interestAccrued;
        marketData.lastAccrueTime = block.timestamp;
    }
    function _isHealthy(address loanToken, address collateralToken, address user) internal view {
        MarketData storage marketData = marketDatas[_getMarketKey(loanToken, collateralToken)];
        UserData storage userData = userDatas[user][_getMarketKey(loanToken, collateralToken)];
        
        uint256 collateralPrice = IPythOracle(marketData.oracle).getPrice();
        uint256 collateralDecimal = 10 ** IERC20Metadata(collateralToken).decimals();

        uint256 borrowAmount = userData.borrowShares * marketData.totalBorrowAssets / marketData.totalBorrowShares;
        uint256 collateralValue = userData.collateralAssets * collateralPrice / collateralDecimal;

        uint256 maxBorrowAmount = collateralValue * marketData.LTV / PERCENTAGE_DENOMINATOR;

        if (borrowAmount > maxBorrowAmount) revert InsufficientCollateral();
    }
    
    // =============================================================================
    // VIEW FUNCTIONS - For reading contract state (frontend integration)
    // =============================================================================

    function getMarketData(address loanToken, address collateralToken) external view returns (MarketData memory) {
        return marketDatas[_getMarketKey(loanToken, collateralToken)];
    }

    function getUserData(address user, address loanToken, address collateralToken) external view returns (UserData memory) {
        return userDatas[user][_getMarketKey(loanToken, collateralToken)];
    }
    
    // =============================================================================
    // ADMINISTRATIVE FUNCTIONS
    // =============================================================================
    
    function setMarketStatus(address loanToken, address collateralToken, bool isActive) 
        external 
        marketExists(loanToken, collateralToken)
    {
        marketDatas[_getMarketKey(loanToken, collateralToken)].isActive = isActive;

        emit MarketStatusSet(loanToken, collateralToken, isActive);
    }
}