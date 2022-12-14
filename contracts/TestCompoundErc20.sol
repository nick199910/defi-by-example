// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/compound.sol";
import "hardhat/console.sol";

contract TestCompoundErc20 {
    IERC20 public token;
    CErc20 public cToken;

    constructor(address _token, address _cToken) {
        token = IERC20(_token);
        cToken = CErc20(_cToken);
    }

    function supply(uint _amount) external {
        token.transferFrom(msg.sender, address(this), _amount);
        token.approve(address(cToken), _amount);
        require(cToken.mint(_amount) == 0, "mint failed");
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
        uint decimals = 8; // USDC = 8 decimals
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
}
