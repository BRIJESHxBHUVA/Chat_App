import { configureStore } from "@reduxjs/toolkit";
import { userDataReducer } from "./reducers/userDataReducer";
import { messagesDataReducer } from "./reducers/messagesDataReducer";
import { authReducer } from "./reducers/authReducer";
import { injectStore } from "../Utils/api";

const store = configureStore({
    reducer: {
        auth: authReducer,
        userData: userDataReducer,
        messagesData: messagesDataReducer,
    },
});

injectStore(store);

export default store;