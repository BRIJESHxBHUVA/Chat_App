import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { authActions } from "../reducers/authReducer";

const rawBaseQuery = fetchBaseQuery({
    baseUrl: process.env.REACT_APP_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
        const token = getState().auth.accessToken;
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
        return headers;
    },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
    let result = await rawBaseQuery(args, api, extraOptions);

    if (result.error && result.error.status === 403) {
        console.log("⏳ Access token expired. Refreshing...");
        const refreshResult = await rawBaseQuery(
            {
                url: "/user/regeneratetoken",
                method: "POST",
                body: { refreshToken: api.getState().auth.refreshToken },
            },
            api,
            extraOptions
        );
        if (refreshResult.data) {
            api.dispatch(
                authActions.setCredentials({
                    data: api.getState().auth.user,
                    accessToken: refreshResult.data.accessToken,
                    refreshToken: refreshResult.data.refreshToken,
                })
            );

            result = await rawBaseQuery(args, api, extraOptions);
        } else {
            api.dispatch(authActions.clearState());
        }
    }

    return result;
}

export default baseQueryWithReauth;