import { createContext, useEffect, useState } from "react";
import axios from "axios";

export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {

    const [cartItems, setCartItems] = useState({});
    const [food_list, setFoodList] = useState([]);
    const [token, setToken] = useState("");

    const url = "food-delivery-production-9bbb.up.railway.app";
    // const url = "http://localhost:5000"

    // ================= ADD TO CART =================
    const addToCart = async (itemId) => {

        // Update UI instantly
        setCartItems((prev) => ({
            ...prev,
            [itemId]: prev[itemId] ? prev[itemId] + 1 : 1
        }));

        // Update backend
        if (token) {
            try {
                await axios.post(
                    url + "/api/cart/add",
                    { itemId },
                    { headers: { token } }
                );
            } catch (error) {
                console.log(error);
            }
        }
    };

    // ================= REMOVE FROM CART =================
    const removeFromCart = async (itemId) => {

        setCartItems((prev) => {
            const newCart = { ...prev };

            if (newCart[itemId] > 1) {
                newCart[itemId] -= 1;
            } else {
                delete newCart[itemId];
            }

            return newCart;
        });

        if (token) {
            try {
                await axios.post(
                    url + "/api/cart/remove",
                    { itemId },
                    { headers: { token } }
                );
            } catch (error) {
                console.log(error);
            }
        }
    };

    // ================= TOTAL AMOUNT =================
    const getTotalCartAmount = () => {
        let totalAmount = 0;

        for (const item in cartItems) {
            if (cartItems[item] > 0) {

                const itemInfo = food_list.find(
                    (product) => product._id === item
                );

                if (itemInfo) {
                    totalAmount += itemInfo.price * cartItems[item];
                }
            }
        }

        return totalAmount;
    };

    // ================= FETCH FOOD =================
    const fetchFoodList = async () => {
        try {
            const response = await axios.get(url + "/api/food/list");

            if (response.data.success) {
                setFoodList(response.data.data);
            }
        } catch (error) {
            console.log(error);
        }
    };

    // ================= LOAD CART =================
    const loadCartData = async (savedToken) => {
        try {
            const response = await axios.post(
                url + "/api/cart/get",
                {},
                { headers: { token: savedToken } }
            );

            if (response.data.success) {
                setCartItems(response.data.cartData || {});
            }

        } catch (error) {
            console.log(error);
        }
    };

    // ================= INITIAL LOAD =================
    useEffect(() => {
        async function loadData() {

            await fetchFoodList();

            const savedToken = localStorage.getItem("token");

            if (savedToken) {
                setToken(savedToken);
                await loadCartData(savedToken);
            }
        }

        loadData();
    }, []);

    // ================= CONTEXT VALUE =================
    const contextValue = {
        food_list,
        cartItems,
        setCartItems,
        addToCart,
        removeFromCart,
        getTotalCartAmount,
        url,
        token,
        setToken
    };

    return (
        <StoreContext.Provider value={contextValue}>
            {props.children}
        </StoreContext.Provider>
    );
};

export default StoreContextProvider;
