import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useEffect } from 'react'
import axios from 'axios'


const ReadSpecific = () => {
  const [product, setProduct] = useState({});
  const params = useParams();
  const id = params.id;
  const getData = async () => {
    const data = await axios({
      url: `http://localhost:8000/product/${id}`,
      method: "GET",
    });
    setProduct(data.data.result);
  };

  useEffect(() => {
    getData();
  }, []);
  
  return (
    <div>
      <p>The product name is {product.name}</p>
      <p>The product price is {product.price}</p>
      <p>The product quantity is {product.quantity}</p>
    </div>
  )
}

export default ReadSpecific