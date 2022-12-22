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
import { TestCompoundErc20 } from "../typechain-types/contracts/TestCompoundErc20";
import { CErc20 } from "../typechain-types";
import { IERC20 } from "../typechain-types/@openzeppelin/contracts/token/ERC20/IERC20";
import { sendEther } from "./utils";

describe("TestCompoundErc20", function () {
    let USDCSigner: Signer, WETHSigner: Signer, DAISigner: Signer;
    let testCompoundErc20: TestCompoundErc20;
    let CUSDCContract: CErc20, CWETHContract: CErc20, CDAIContract: CErc20;
    let USDCContract: IERC20, WETHContract: IERC20, DAIContract: IERC20;
    let DEPOSIT_AMOUNT = ethers.BigNumber.from(10).pow(18).mul(10);

    beforeEach(async () => {
        const WETH: string = tokenAddreess.WETH.WETH9;
        const CWETH: string = tokenAddreess.CTOKEN.CWETH;

        const USDC: string = tokenAddreess.USDC;
        const CUSDC: string = tokenAddreess.CTOKEN.CUSDC;

        const DAI: string = tokenAddreess.DAI;
        const CDAI: string = tokenAddreess.CTOKEN.CDAI;

        const USDCSignerAddress: string = tokenAddreess.Signer.USDCSigner;
        const WETHSignerAddress: string = tokenAddreess.Signer.WETHSigner;
        const DAISignerAddress: string = tokenAddreess.Signer.DAISigner;

        let signers: Signer[] = await ethers.getSigners();

        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [DAISignerAddress],
        });
        DAISigner = await ethers.getSigner(DAISignerAddress);

        // // ======================
        // console.log(ethers.utils.formatEther(await signers[0].getBalance()));
        // await sendEther(signers[0], USDCSigner, 1000);
        // const tx = {
        //     from: await signers[0].getAddress(),
        //     to: await USDCSigner.getAddress(),
        //     value: 10000,
        //     gasPrice: 250000000000,
        //     gasLimit: 1001000,
        // };
        // const receipt = await signers[0].sendTransaction(tx);
        // await receipt.wait();
        // ======================
        console.log("ffffffffffffffffffffffff");
        const TestCompoundErc20 = await ethers.getContractFactory(
            "TestCompoundErc20"
        );
        testCompoundErc20 = await TestCompoundErc20.deploy(DAI, CDAI);
        await testCompoundErc20.deployed();
        console.log("testCompoundErc20: " + testCompoundErc20.address);

        // 拿到未部署合约的实例

        DAIContract = await ethers.getContractAt("IERC20", DAI);
        CDAIContract = await ethers.getContractAt("CErc20", CDAI);

        console.log(
            "DAIContract balance: " +
                (await DAIContract.balanceOf(DAISignerAddress)) +
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

        let DAIBalance: BigNumber = await DAIContract.balanceOf(
            testCompoundErc20.address
        );
        let CDAIBalance: BigNumber = await CDAIContract.balanceOf(
            testCompoundErc20.address
        );
        return {
            exchangeRate,
            supplyRate,
            estimateBalance,
            balanceOfUnderlying,
            DAIBalance,
            CDAIBalance,
        };
    };

    it("should supply and redeem", async () => {
        let approveTx = await DAIContract.connect(DAISigner).approve(
            testCompoundErc20.address,
            DEPOSIT_AMOUNT
        );
        await approveTx.wait();

        console.log("after approve...");

        let tx = await testCompoundErc20
            .connect(DAISigner)
            .supply(DEPOSIT_AMOUNT, {
                gasPrice: 250000000000,
                gasLimit: 10010000,
                from: await DAISigner.getAddress(),
            });
        await tx.wait();

        console.log("+++++++++++++++++++++++++");
        let after = await snapshot(
            testCompoundErc20,
            DAIContract,
            CDAIContract
        );

        console.log("--- supply ---");
        console.log(`exchange rate ${after.exchangeRate}`);
        console.log(`supply rate ${after.supplyRate}`);
        console.log(`estimate balance ${after.estimateBalance}`);
        console.log(`balance of underlying ${after.balanceOfUnderlying}`);
        console.log(`token balance ${after.DAIBalance}`);
        console.log(`c token balance ${after.CDAIBalance}`);

        // accrue interest
        const block = await ethers.provider.getBlockNumber();
        await mine(1000);

        after = await snapshot(testCompoundErc20, DAIContract, CDAIContract);

        console.log(`--- after some blocks... ---`);
        console.log(`balance of underlying ${after.balanceOfUnderlying}`);

        // test redeem
        const cTokenAmount = await CDAIContract.balanceOf(
            testCompoundErc20.address
        );

        tx = await testCompoundErc20.connect(DAISigner).redeem(cTokenAmount, {
            from: await DAISigner.getAddress(),
        });
        await tx.wait();

        after = await snapshot(testCompoundErc20, DAIContract, CDAIContract);

        console.log(`--- redeem ---`);
        console.log(`balance of underlying ${after.balanceOfUnderlying}`);
        console.log(`token balance ${after.DAIBalance}`);
        console.log(`c token balance ${after.CDAIBalance}`);
    });
});
// });
