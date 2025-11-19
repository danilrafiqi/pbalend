// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {IPythOracle} from "./interfaces/IPythOracle.sol";
import {IERC20Metadata} from "../lib/openzeppelin-contracts/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {IFlashLoanReceiver} from "./interfaces/IFlashLoanReceiver.sol";

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
    error NotOwner();
    error ErrorPaused();
    error ErrNotPaused();

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
    
    // Ownership / circuit-breaker events
    event Paused(address indexed account);
    event Unpaused(address indexed account);

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
    uint256 public constant FLASH_LOAN_FEE = 5e15; // 0.5% fee in basis points
    
    // Owner for administrative functions
    address public owner;

    // Circuit breaker flag
    bool private _paused;

    // =============================================================================
    // MODIFIERS
    // =============================================================================

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier whenNotPaused() {
        if (_paused) revert ErrorPaused();
        _;
    }

    modifier whenPaused() {
        if (!_paused) revert ErrNotPaused();
        _;
    }

    /**
     * @dev Ensures the market exists and is active
     */
    modifier marketExists(address token, address collateralToken) {
        if (!marketDatas[_getMarketKey(token, collateralToken)].isActive) revert MarketNotActive();
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
    
    constructor() {
        owner = msg.sender;
        _paused = false;
    }
    

    // =============================================================================
    // OWNER FUNCTIONS - access control + circuit breaker
    // =============================================================================

    // pause contract (circuit breaker)
    function pause() external onlyOwner whenNotPaused {
        _paused = true;
        emit Paused(msg.sender);
    }

    // unpause contract
    function unpause() external onlyOwner whenPaused {
        _paused = false;
        emit Unpaused(msg.sender);
    }

    // =============================================================================
    // MARKET MANAGEMENT FUNCTIONS
    // =============================================================================
    
    function createMarket(
        address token,
        address collateralToken,
        uint256 interestRate,
        uint256 LTV,
        address oracle
    ) external onlyOwner whenNotPaused {
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
        whenNotPaused
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
        if (!IERC20(loanToken).transferFrom(msg.sender, address(this), amount)) revert TransferFailed();
        
        emit Deposit(loanToken, collateralToken, msg.sender, amount, shares);
    }
    
    // =============================================================================
    // BORROWING FUNCTIONS
    // =============================================================================
    
    function borrow(address loanToken, address collateralToken, uint256 amount, uint256 collateralAmount) 
        external 
        marketExists(loanToken, collateralToken) 
        validAmount(amount)
        whenNotPaused
    {
        MarketData storage marketData = marketDatas[_getMarketKey(loanToken, collateralToken)];
        UserData storage userData = userDatas[msg.sender][_getMarketKey(loanToken, collateralToken)];
        
        // Update interest before calculations
        _accrueInterest(loanToken, collateralToken);

        userData.collateralAssets += collateralAmount;

        // Transfer collateral from user to contract
        if (!IERC20(collateralToken).transferFrom(msg.sender, address(this), collateralAmount)) revert TransferFailed();

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

        // Transfer loan tokens to user
        if (!IERC20(loanToken).transfer(msg.sender, amount)) revert TransferFailed();
        
        emit Borrow(loanToken, collateralToken, msg.sender, amount, shares, collateralAmount);
    }
    
    // =============================================================================
    // REPAYMENT FUNCTIONS
    // =============================================================================
    
    function repay(address loanToken, address collateralToken, uint256 amount) 
        external 
        marketExists(loanToken, collateralToken) 
        validAmount(amount)
        whenNotPaused
    {
        MarketData storage marketData = marketDatas[_getMarketKey(loanToken, collateralToken)];
        UserData storage userData = userDatas[msg.sender][_getMarketKey(loanToken, collateralToken)];

        _accrueInterest(loanToken, collateralToken);

        if (userData.borrowShares == 0) revert InsufficientShares();
        if (marketData.totalBorrowAssets == 0 || marketData.totalBorrowShares == 0) revert InsufficientShares();

        uint256 repayShares = amount * marketData.totalBorrowShares / marketData.totalBorrowAssets;
        if (repayShares > userData.borrowShares) {
            repayShares = userData.borrowShares;
        }

        uint256 repayAmount = repayShares * marketData.totalBorrowAssets / marketData.totalBorrowShares;

        // Update accounting
        userData.borrowShares -= repayShares;
        marketData.totalBorrowShares -= repayShares;
        marketData.totalBorrowAssets -= repayAmount;

        // Transfer loan token from user to contract
        if (!IERC20(loanToken).transferFrom(msg.sender, address(this), repayAmount)) revert TransferFailed();

        emit Repay(loanToken, collateralToken, msg.sender, repayShares, repayAmount);
    }
    
    // =============================================================================
    // WITHDRAWAL FUNCTIONS
    // =============================================================================
    
    function withdraw(address loanToken, address collateralToken, uint256 shares) 
        external 
        marketExists(loanToken, collateralToken) 
        validAmount(shares) 
        whenNotPaused
    {
        MarketData storage marketData = marketDatas[_getMarketKey(loanToken, collateralToken)];
        UserData storage userData = userDatas[msg.sender][_getMarketKey(loanToken, collateralToken)];

        _accrueInterest(loanToken, collateralToken);

        if (shares > userData.depositShares) revert InsufficientShares();
        if (marketData.totalDepositShares == 0) revert InsufficientShares();

        uint256 amount = shares * marketData.totalDepositAssets / marketData.totalDepositShares;

        // Check if liquidity is sufficient
        uint256 availableLiquidity = marketData.totalDepositAssets - marketData.totalBorrowAssets;
        if (amount > availableLiquidity) revert InsufficientLiquidity();

        // Update accounting
        userData.depositShares -= shares;
        marketData.totalDepositShares -= shares;
        marketData.totalDepositAssets -= amount;

        // Transfer loan token to user
        if (!IERC20(loanToken).transfer(msg.sender, amount)) revert TransferFailed();

        emit Withdraw(loanToken, collateralToken, msg.sender, amount, shares);
    }

    function withdrawCollateral(address loanToken, address collateralToken, uint256 amount) 
        external 
        marketExists(loanToken, collateralToken) 
        validAmount(amount) 
        whenNotPaused
    {
        UserData storage userData = userDatas[msg.sender][_getMarketKey(loanToken, collateralToken)];

        _accrueInterest(loanToken, collateralToken);

        if (amount > userData.collateralAssets) revert InsufficientBalance();

        // Temporarily reduce collateral and check if position stays healthy
        userData.collateralAssets -= amount;

        // Revert if user becomes undercollateralized
        _isHealthy(loanToken, collateralToken, msg.sender);

        // Transfer collateral back to user
        if (!IERC20(collateralToken).transfer(msg.sender, amount)) revert TransferFailed();

        emit WithdrawCollateral(loanToken, collateralToken, msg.sender, amount);
    }

    // =============================================================================
    // ADDITIONAL FUNCTIONS
    // =============================================================================
    
    function flashLoan(address token, uint256 amount, bytes calldata data) external whenNotPaused {
        /**
         * FLASH LOAN IMPLEMENTATION (similar to Aave)
         * 
         * Flow:
         * 1. Check if enough liquidity is available
         * 2. Transfer token to caller
         * 3. Call executeOperation on caller contract
         * 4. Verify tokens + fee are returned
         * 5. Update market state if needed
         */
        
        // Validate amount
        if (amount == 0) revert InvalidAmount();
        
        // Get balance before flash loan
        uint256 balanceBefore = IERC20(token).balanceOf(address(this));
        
        // Calculate fee (0.5% of amount)
        uint256 fee = amount * FLASH_LOAN_FEE / PERCENTAGE_DENOMINATOR;
        
        // Ensure contract has enough liquidity
        if (balanceBefore < amount) revert InsufficientLiquidity();
        
        // Transfer token to receiver
        if (!IERC20(token).transfer(msg.sender, amount)) revert TransferFailed();
        
        // Call executeOperation on receiver contract
        bool success = IFlashLoanReceiver(msg.sender).executeOperation(
            token,
            amount,
            fee,
            data
        );
        
        if (!success) revert TransferFailed();
        
        // Verify that tokens + fee are returned
        uint256 balanceAfter = IERC20(token).balanceOf(address(this));
        if (balanceAfter < balanceBefore + fee) revert InsufficientLiquidity();
        
        emit FlashLoan(token, msg.sender, amount);
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
        onlyOwner
        marketExists(loanToken, collateralToken)
    {
        marketDatas[_getMarketKey(loanToken, collateralToken)].isActive = isActive;

        emit MarketStatusSet(loanToken, collateralToken, isActive);
    }
}