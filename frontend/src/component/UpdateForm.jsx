import axios from "axios";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const UpdateForm = () => {
  const params = useParams();
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [isDamage, setIsDamage] = useState(false);
  const id = params.id;

  const getData = async () => {
    const data = await axios({
      url: `http://localhost:8000/product/${id}`,
      method: "GET",
    });
    setName(data.data.result.name);
    setQuantity(data.data.result.quantity);
    setPrice(data.data.result.price);
    setIsDamage(data.data.result.isDamage);
  };
  console.log(data);

  useEffect(() => {
    getData();
  }, []);

  const handleClick = async (e) => {
    e.preventDefault();
    const data = {
      name: name,
      quantity: quantity,
      price: price,
      isDamage: isDamage,
    };
    const result = await axios({
      url: `http://localhost:8000/product/${id}`,
      method: "PUT",
      data: data,
   }); 
  };


  return (
    <form>
      <div>
        <div>
          <div>
            <label htmlFor="Name">Name: </label>
            <input
              type="text"
              name=""
              id="Name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
              }}
            />
          </div>
          <div style={{ marginTop: "10px" }}>
            <label htmlFor="Quantity">Quantity: </label>
            <input
              type="text"
              name=""
              id="Quantity"
              value={quantity}
              onChange={(e) => {
                setQuantity(e.target.value);
              }}
            />
          </div>
          <div style={{ marginTop: "10px" }}>
            <label htmlFor="Price">Price: </label>
            <input
              type="text"
              name=""
              id="Price"
              value={price}
              onChange={(e) => {
                setPrice(e.target.value);
              }}
            />
          </div>
          <div style={{ marginTop: "10px" }}>
            <label htmlFor="Damage">Is Damage: </label>
            <input
              type="checkbox"
              name=""
              id="Damage"
              checked={isDamage}
              onChange={(e) => {
                setIsDamage(e.target.checked);
              }}
            />
          </div>
        </div>
        <div style={{ marginTop: "10px" }}>
          <button>Update</button>
        </div>
      </div>
    </form>
  );
};

export default UpdateForm;
