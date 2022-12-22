// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/compound.sol";
import "hardhat/console.sol";

contract TestCompoundErc20 {
    IERC20 public token;
    CErc20 public cToken;
    string public _test;

    constructor(address _token, address _cToken) {
        token = IERC20(_token);
        cToken = CErc20(_cToken);
    }

    function supply(uint _amount) external {
        console.log(
            "token allowance: %d , owner %s, spender",
            token.allowance(msg.sender, address(this)),
            msg.sender,
            address(this)
        );
        token.transferFrom(msg.sender, address(this), _amount);
        console.log(token.balanceOf(address(this)));
        console.log("transfer success!!!");
        token.approve(address(cToken), _amount);
        console.log("approve success!!!");
        // 注意两次调用函数
        // console.log("mint ... %d", cToken.mint(_amount));
        require(cToken.mint(_amount) == 0, "mint failed");
        console.log("require success!!!");
    }

    function getCTokenBalance() external view returns (uint) {
        return cToken.balanceOf(address(this)); // 测试可以拿到多少ctoken
    }

    // not view function
    function getInfo() external returns (uint exchangeRate, uint supplyRate) {
        // 从ctoken到对应的token的兑换汇率
        exchangeRate = cToken.exchangeRateCurrent();

        // 当前块供应的erc20的token的数量
        supplyRate = cToken.supplyRatePerBlock();
        return (exchangeRate, supplyRate);
    }

    // 真实兑换后能得到多少token
    function estimateBalanceOfUnderlying() external returns (uint) {
        uint cTokenBal = cToken.balanceOf(address(this));
        uint exchangeRate = cToken.exchangeRateCurrent();
        uint decimals = 18; // WETH = 18 decimals
        uint cTokendecimals = 8;
        return
            (cTokenBal * exchangeRate) / 10**(18 + decimals - cTokendecimals);
    }

    // ctoken * exchangeRate
    function balanceOfUnderlying() external returns (uint) {
        return cToken.balanceOfUnderlying(address(this));
    }

    function redeem(uint _cTokenAmount) external {
        require(cToken.redeem(_cTokenAmount) == 0, "redeem failed");
    }

    // borrow and repay
    // collateral
    // account liquidity - calculate how much can I borrow
    // open price feed - USD price of token to borrow
    // enter market and borrow
    // borrowed balance (includes interest)
    // borrow rate
    // repay borrow

    // borrow and repay
    Comptroller public comptroller =
        Comptroller(0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B);
    PriceFeed public priceFeed =
        PriceFeed(0x922018674c12a7F0D394ebEEf9B58F186CdE13c1);

    // collateral
    // isComped -> the ctoken going to receive the compound reward token comp
    function getCollateralFactor() external view returns (uint) {
        (bool isListed, uint colFactor, bool isComped) = comptroller.markets(
            address(cToken)
        );
        return colFactor; // divide by 1e18 to get in %
    }

    // account liquidity -> calculate how much can I borrow

    function getAccountLiquidity()
        external
        view
        returns (uint liquidity, uint shortfall)
    {
        // liquidity and shortfall in USD scaled up by 1e18
        (uint error, uint _liquidity, uint _shortfall) = comptroller
            .getAccountLiquidity(address(this));

        require(error == 0, "error");
        // normal circumstance - liquidity > 0 and shortfall == 0
        // liquidity > 0 means account can borrow up to `liquidity`
        // shortfall > 0 is subject to liquidation, you borrowed over limit
        return (_liquidity, _shortfall);
    }

    // open price feed - USD price of token to borrow
    function getPriceFeed(address _cToken) external view returns (uint) {
        // scaled up by 1e18
        return priceFeed.getUnderlyingPrice(_cToken);
    }

    // enter market and borrow
    function borrow(address _cTokenToBorrow, uint _decimals) external {
        // enter market

        // enter the supply market so you can borrow another type of asset
        address[] memory cTokens = new address[](1);
        cTokens[0] = address(cToken);
        uint[] memory errors = comptroller.enterMarkets(cTokens);
        require(errors[0] == 0, "Comptroller.enterMarkets failed.");

        // check liquidity
        (uint error, uint liquidity, uint shortfall) = comptroller
            .getAccountLiquidity(address(this));

        require(error == 0, "error");
        require(shortfall == 0, "shortfall > 0");
        require(liquidity > 0, "liquidity = 0");

        // calculate max borrow
        uint price = priceFeed.getUnderlyingPrice(_cTokenToBorrow);

        // liquidity  - USD scaled up by 1e18
        // price - USD scaled up by 1e18
        // decimals - decimals of token to borrow
        uint maxBorrow = (liquidity * (10**_decimals)) / price;
        require(maxBorrow > 0, "max borrow = 0");

        // borrow 50% of max borrow
        uint amount = (maxBorrow * 50) / 100;
        require(CErc20(_cTokenToBorrow).borrow(amount) == 0, "borrow failed");
    }

    // borrow balance (includes interest)
    // not view function
    function getBorrowBalance(address _cTokenBorrowed) public returns (uint) {
        return CErc20(_cTokenBorrowed).borrowBalanceCurrent(address(this));
    }

    // borrow rate
    function getBorrowRatePerBlock(address _cTokenBorrowed)
        external
        view
        returns (uint)
    {
        // scaled up by 1e18
        return CErc20(_cTokenBorrowed).borrowRatePerBlock();
    }

    // repay borrow
    function repay(
        address _tokenBorrowed,
        address _cTokenBorrowed,
        uint _amount
    ) external {
        IERC20(_tokenBorrowed).approve(_cTokenBorrowed, _amount);
        require(
            CErc20(_cTokenBorrowed).repayBorrow(_amount) == 0,
            "repay failed"
        );
    }
}
