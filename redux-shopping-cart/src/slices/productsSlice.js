import {
    createAsyncThunk,
    createSlice,
    isAnyOf,
} from "@reduxjs/toolkit";

const API = "http://localhost:3001/products";

// Gửi request và kiểm tra lỗi HTTP.
async function request(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
    });

    if (!response.ok) {
        throw new Error(`API trả về lỗi ${response.status}`);
    }

    if (response.status === 204) {
        return null;
    }

    const text = await response.text();

    return text ? JSON.parse(text) : null;
}

// READ: Lấy danh sách sản phẩm.
export const fetchProducts = createAsyncThunk(
    "products/fetchProducts",
    async(_, { rejectWithValue }) => {
        try {
            const products = await request(API);
            return products;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }, {
        condition: (_, { getState }) => {
            const products = getState().products;

            return (
                products.status !== "loading" &&
                products.saveStatus !== "loading"
            );
        },
    }
);

// CREATE: Thêm sản phẩm.
export const createProduct = createAsyncThunk(
    "products/createProduct",
    async(product, { rejectWithValue }) => {
        try {
            const createdProduct = await request(API, {
                method: "POST",
                body: JSON.stringify(product),
            });

            return createdProduct;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// UPDATE: Cập nhật sản phẩm.
export const updateProduct = createAsyncThunk(
    "products/updateProduct",
    async(product, { rejectWithValue }) => {
        try {
            const updatedProduct = await request(
                `${API}/${product.id}`, {
                    method: "PUT",
                    body: JSON.stringify(product),
                }
            );

            return updatedProduct;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// DELETE: Xóa sản phẩm.
export const deleteProduct = createAsyncThunk(
    "products/deleteProduct",
    async(id, { rejectWithValue }) => {
        try {
            await request(`${API}/${id}`, {
                method: "DELETE",
            });

            return id;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const productsSlice = createSlice({
    name: "products",

    initialState: {
        items: [],
        status: "idle",
        saveStatus: "idle",
        error: null,
    },

    reducers: {},

    extraReducers: (builder) => {
        builder
        // GET: Bắt đầu tải.
            .addCase(fetchProducts.pending, (state) => {
            state.status = "loading";
            state.error = null;
        })

        // GET: Thành công.
        .addCase(fetchProducts.fulfilled, (state, action) => {
            state.status = "succeeded";
            state.items = action.payload;
        })

        // GET: Thất bại.
        .addCase(fetchProducts.rejected, (state, action) => {
            state.status = "failed";
            state.error =
                action.payload ||
                action.error.message ||
                "Không thể tải danh sách sản phẩm.";
        })

        // CREATE: Thêm sản phẩm vào Redux.
        .addCase(createProduct.fulfilled, (state, action) => {
            state.items.push(action.payload);
        })

        // UPDATE: Thay sản phẩm cũ bằng dữ liệu mới.
        .addCase(updateProduct.fulfilled, (state, action) => {
            const index = state.items.findIndex(
                (product) => product.id === action.payload.id
            );

            if (index !== -1) {
                state.items[index] = action.payload;
            }
        })

        // DELETE: Loại sản phẩm khỏi Redux.
        .addCase(deleteProduct.fulfilled, (state, action) => {
            state.items = state.items.filter(
                (product) => product.id !== action.payload
            );
        })

        // Trạng thái bắt đầu thêm/sửa/xóa.
        .addMatcher(
            isAnyOf(
                createProduct.pending,
                updateProduct.pending,
                deleteProduct.pending
            ),
            (state) => {
                state.saveStatus = "loading";
                state.error = null;
            }
        )

        // Trạng thái thêm/sửa/xóa thành công.
        .addMatcher(
            isAnyOf(
                createProduct.fulfilled,
                updateProduct.fulfilled,
                deleteProduct.fulfilled
            ),
            (state) => {
                state.saveStatus = "succeeded";
            }
        )

        // Trạng thái thêm/sửa/xóa thất bại.
        .addMatcher(
            isAnyOf(
                createProduct.rejected,
                updateProduct.rejected,
                deleteProduct.rejected
            ),
            (state, action) => {
                state.saveStatus = "failed";
                state.error =
                    action.payload ||
                    action.error.message ||
                    "Thao tác sản phẩm thất bại.";
            }
        );
    },
});

export default productsSlice.reducer;