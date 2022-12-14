import {
    time,
    mine,
    loadFixture,
} from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { artifacts, ethers, network } from "hardhat";
import * as tokenAddreess from "../token_address.json";
import { Signer, BigNumber } from "ethers";
import { token } from "../typechain-types/@openzeppelin/contracts";
import { TestCompoundErc20 } from "../typechain-types/contracts/TestCompoundErc20";
import { CErc20 } from "../typechain-types";
import { IERC20 } from "../typechain-types/@openzeppelin/contracts/token/ERC20/IERC20";

describe("TestCompoundErc20", function () {
    let WBTCSigner: Signer, USDCSigner: Signer;
    let testCompoundErc20: TestCompoundErc20;
    let CWBTCContract: CErc20, CUSDCContract: CErc20;
    let WBTCContract: IERC20, USDCContract: IERC20;
    let DEPOSIT_AMOUNT = ethers.BigNumber.from(10).pow(8).mul(1);

    beforeEach(async () => {
        const WBTC: string = tokenAddreess.WBTC;
        const WETH: string = tokenAddreess.WETH.WETH9;
        const CWBTC: string = tokenAddreess.CTOKEN.CWBTC;
        const USDC: string = tokenAddreess.USDC;
        const CUSDC: string = tokenAddreess.CTOKEN.CUSDC;

        const WBTCSignerAddress: string = tokenAddreess.Signer.WBTCSigner;
        const USDCSignerAddress: string = tokenAddreess.Signer.USDCSigner;

        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [WBTCSignerAddress],
        });
        WBTCSigner = await ethers.getSigner(WBTCSignerAddress);

        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [USDCSignerAddress],
        });
        USDCSigner = await ethers.getSigner(USDCSignerAddress);

        const TestCompoundErc20 = await ethers.getContractFactory(
            "TestCompoundErc20"
        );
        testCompoundErc20 = await TestCompoundErc20.deploy(USDC, CUSDC);
        await testCompoundErc20.deployed();
        console.log("testCompoundErc20: " + testCompoundErc20.address);

        // 拿到未部署合约的实例
        WBTCContract = await ethers.getContractAt("IERC20", WBTC);
        CWBTCContract = await ethers.getContractAt("CErc20", CWBTC);
        USDCContract = await ethers.getContractAt("IERC20", USDC);
        CUSDCContract = await ethers.getContractAt("CErc20", CUSDC);
        console.log(
            "USDCContract balance: " +
                (await USDCContract.balanceOf(USDCSignerAddress)) +
                "\n"
        );
    });

    const snapshot = async (
        _testCompoundErc20: TestCompoundErc20,
        _token: IERC20,
        _ctpken: CErc20
    ) => {
        const { exchangeRate, supplyRate } =
            await _testCompoundErc20.callStatic.getInfo();

        let estimateBalance: BigNumber =
            await _testCompoundErc20.callStatic.estimateBalanceOfUnderlying();

        //
        let balanceOfUnderlying: BigNumber =
            await testCompoundErc20.callStatic.balanceOfUnderlying();
        let USDCBalance: BigNumber = await USDCContract.balanceOf(
            testCompoundErc20.address
        );
        let CUSDCBalance: BigNumber = await CUSDCContract.balanceOf(
            testCompoundErc20.address
        );
        return {
            exchangeRate,
            supplyRate,
            estimateBalance,
            balanceOfUnderlying,
            USDCBalance,
            CUSDCBalance,
        };
    };

    // describe("function test", () => {
    it("should supply and redeem", async () => {
        let approveTx = await USDCContract.connect(USDCSigner).approve(
            testCompoundErc20.address,
            DEPOSIT_AMOUNT
        );
        await approveTx.wait();

        let tx = await testCompoundErc20.connect(USDCSigner).supply(10000, {
            gasPrice: 250000000000,
            gasLimit: 1001000,
            from: await USDCSigner.getAddress(),
        });
        await tx.wait();

        let after = await snapshot(
            testCompoundErc20,
            USDCContract,
            CUSDCContract
        );

        console.log("--- supply ---");
        console.log(`exchange rate ${after.exchangeRate}`);
        console.log(`supply rate ${after.supplyRate}`);
        console.log(`estimate balance ${after.estimateBalance}`);
        console.log(`balance of underlying ${after.balanceOfUnderlying}`);
        console.log(`token balance ${after.USDCBalance}`);
        console.log(`c token balance ${after.CUSDCBalance}`);

        // accrue interest
        const block = await ethers.provider.getBlockNumber();
        await mine(100);
    });
});
// });
