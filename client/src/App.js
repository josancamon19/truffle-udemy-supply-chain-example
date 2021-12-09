import React, { Component } from "react";
import ItemManagerContract from "./contracts/ItemManager.json";
import ItemContract from "./contracts/Item.json";
import getWeb3 from "./getWeb3";

import "./App.css";

class App extends Component {
  state = {
    storageValue: 0,
    web3: null,
    accounts: null,
    itemManagerContract: null,
    itemContract: null,

    itemCost: 0,
    itemIdentifier: "",
  };

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();

      const itemManagerContract = new web3.eth.Contract(
        ItemManagerContract.abi,
        ItemManagerContract.networks[networkId] &&
          ItemManagerContract.networks[networkId].address
      );

      const itemContract = new web3.eth.Contract(
        ItemContract.abi,
        ItemContract.networks[networkId] &&
          ItemContract.networks[networkId].address
      );

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      console.log(itemManagerContract);
      this.setState(
        {
          web3,
          accounts,
          itemManagerContract: itemManagerContract,
          itemContract: itemContract,
        },
        this.runExample
      );

      this.listenToSupplyChainEvents();
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`
      );
      console.error(error);
    }
  };

  listenToSupplyChainEvents = () => {
    this.state.itemManagerContract.events
      .SupplyChainStep()
      .on("data", async function (event) {
        let itemAddress = event.returnValues._itemAddress;
        let state = event.returnValues._step;
        console.log(`item ${itemAddress} is in state ${state}`);
      });
  };

  handleInputChange = (e) => {
    this.setState({
      [e.target.name]: e.target.value,
    });
  };

  handleSubmit = async (e) => {
    const { itemCost, itemIdentifier } = this.state;
    let result = await this.state.itemManagerContract.methods
      .createItem(itemIdentifier, itemCost)
      .send({ from: this.state.accounts[0] });

    let createdItemAddress =
      result.events.SupplyChainStep.returnValues._itemAddress;
  };

  render() {
    if (!this.state.web3) {
      return <div> Loading Web3, accounts, and contract... </div>;
    }
    return (
      <div className="App">
        <h1>Event Trigger / Supply Chain Example</h1>
        <h2>Items</h2>
        <h2>Add items</h2>
        <label htmlFor="itemIdentifier">Item identifier:</label>
        <input
          type="string"
          name="itemIdentifier"
          id="itemIdentifier"
          value={this.state.itemIdentifier}
          onChange={this.handleInputChange}
        />

        <label htmlFor="costInWei">Cost in Wei:</label>
        <input
          type="number"
          name="itemCost"
          id="itemCost"
          value={this.state.itemCost}
          onChange={this.handleInputChange}
        />

        <input
          type="submit"
          name="submit"
          id="submit"
          value="Create new item"
          onClick={this.handleSubmit}
        />
      </div>
    );
  }
}

export default App;
