pragma solidity ^0.8.0;
import "@openzeppelin/contracts/access/Ownable.sol";

contract Item {
  uint256 public priceInWei;
  uint256 public pricePaid;
  uint256 public index;
  ItemManager parentContract;

  constructor(
    ItemManager _parentContract,
    uint256 _priceInWei,
    uint256 _index
  ) {
    priceInWei = _priceInWei;
    index = _index;
    parentContract = _parentContract;
  }

  receive() external payable {
    require(pricePaid == 0, "Item is already paid");
    require(priceInWei == msg.value, "Only full payments accepted");

    pricePaid += msg.value;

    (bool success, ) = payable(address(parentContract)).call{
      value: msg.value
    }(abi.encodeWithSignature("triggerPayment(uint256)", index));

    require(success, "The transaction wasn't succesful, cancelling");
  }
}

contract ItemManager is Ownable {
  enum SupplyChainState { Created, Paid, Delivered }

  struct ItemData {
    Item _itemContract;
    string _identifier;
    uint256 _itemPrice;
    SupplyChainState _state;
  }
  // 0,000000000000001
  mapping(uint256 => ItemData) public items;
  uint256 itemIndex;

  event SupplyChainStep(
    uint256 _itemIndex,
    uint256 _step,
    address _itemAddress
  );

  function createItem(string memory _identifier, uint256 _itemPrice)
    public
    onlyOwner
  {
    items[itemIndex]._itemContract = new Item(this, _itemPrice, itemIndex);
    items[itemIndex]._identifier = _identifier;
    items[itemIndex]._itemPrice = _itemPrice;
    items[itemIndex]._state = SupplyChainState.Created;

    emitChainStep(itemIndex);
    itemIndex++;
  }

  function triggerPayment(uint256 _itemIndex) public payable {
    require(
      items[_itemIndex]._itemPrice == msg.value,
      "Only full payments accepted"
    );
    require(
      items[_itemIndex]._state == SupplyChainState.Created,
      "Item is in not in available"
    );
    items[_itemIndex]._state = SupplyChainState.Paid;

    emitChainStep(_itemIndex);
  }

  function triggerDelivery(uint256 _itemIndex) public onlyOwner {
    require(
      items[_itemIndex]._state == SupplyChainState.Paid,
      "Item is not in an ready to deliver state"
    );
    items[_itemIndex]._state = SupplyChainState.Delivered;

    emitChainStep(_itemIndex);
  }

  function emitChainStep(uint256 _itemIndex) private {
    emit SupplyChainStep(
      _itemIndex,
      uint256(items[_itemIndex]._state),
      address(items[_itemIndex]._itemContract)
    );
  }
}
