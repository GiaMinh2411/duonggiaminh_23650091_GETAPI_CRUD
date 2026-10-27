import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "./slices/productsSlice";

const emptyForm = {
  name: "",
  price: "",
};

function formatMoney(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
}

export default function App() {
  const dispatch = useDispatch();

  const { items, status, saveStatus, error } = useSelector(
    (state) => state.products
  );

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");

  const busy =
    status === "loading" || saveStatus === "loading";

  // Yêu cầu 1: GET API bằng createAsyncThunk.
  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchProducts());
    }
  }, [dispatch, status]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  // Yêu cầu 2: CREATE hoặc UPDATE bằng createAsyncThunk.
  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    const name = form.name.trim();
    const price = Number(form.price);

    if (!name) {
      setMessage("Vui lòng nhập tên sản phẩm.");
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      setMessage("Giá sản phẩm phải lớn hơn 0.");
      return;
    }

    try {
      if (editingId !== null) {
        await dispatch(
          updateProduct({
            id: editingId,
            name,
            price,
          })
        ).unwrap();

        setMessage("Cập nhật sản phẩm thành công.");
      } else {
        await dispatch(
          createProduct({
            name,
            price,
          })
        ).unwrap();

        setMessage("Thêm sản phẩm thành công.");
      }

      resetForm();
    } catch (err) {
      setMessage(
        "Thao tác thất bại: " +
          (typeof err === "string" ? err : err.message)
      );
    }
  }

  function handleEdit(product) {
    setEditingId(product.id);

    setForm({
      name: product.name,
      price: String(product.price),
    });

    setMessage("");
  }

  // DELETE bằng createAsyncThunk.
  async function handleDelete(product) {
    const confirmed = window.confirm(
      `Bạn muốn xóa sản phẩm "${product.name}"?`
    );

    if (!confirmed) return;

    setMessage("");

    try {
      await dispatch(deleteProduct(product.id)).unwrap();

      if (editingId === product.id) {
        resetForm();
      }

      setMessage("Xóa sản phẩm thành công.");
    } catch (err) {
      setMessage(
        "Xóa thất bại: " +
          (typeof err === "string" ? err : err.message)
      );
    }
  }

  return (
    <main className="container">
      <h1>Quản lý sản phẩm</h1>
      <p>GET API và CRUD bằng Redux Toolkit createAsyncThunk</p>

      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <section>
        <h2>
          {editingId !== null
            ? "Cập nhật sản phẩm"
            : "Thêm sản phẩm"}
        </h2>

        <form onSubmit={handleSubmit}>
          <label htmlFor="name">Tên sản phẩm</label>
          <input
            id="name"
            type="text"
            placeholder="Nhập tên sản phẩm"
            value={form.name}
            required
            onChange={(event) =>
              setForm({
                ...form,
                name: event.target.value,
              })
            }
          />

          <label htmlFor="price">Giá sản phẩm (VNĐ)</label>
          <input
            id="price"
            type="number"
            placeholder="Nhập giá sản phẩm"
            min="1"
            step="1"
            value={form.price}
            required
            onChange={(event) =>
              setForm({
                ...form,
                price: event.target.value,
              })
            }
          />

          <div className="actions">
            <button
              type="submit"
              disabled={busy || status !== "succeeded"}
            >
              {saveStatus === "loading"
                ? "Đang xử lý..."
                : editingId !== null
                  ? "Lưu thay đổi"
                  : "Thêm sản phẩm"}
            </button>

            {editingId !== null && (
              <button
                type="button"
                className="secondary"
                disabled={busy}
                onClick={resetForm}
              >
                Hủy sửa
              </button>
            )}
          </div>
        </form>
      </section>

      <section>
        <div className="toolbar">
          <h2>Danh sách sản phẩm</h2>

          <button
            disabled={busy}
            onClick={() => {
              setMessage("");
              dispatch(fetchProducts());
            }}
          >
            {status === "loading"
              ? "Đang tải..."
              : "GET API / Tải lại"}
          </button>
        </div>

        {status === "loading" && (
          <p>Đang lấy dữ liệu từ API...</p>
        )}

        {status === "failed" && (
          <p>
            Không tải được dữ liệu. Hãy kiểm tra JSON Server
            tại cổng 3001, sau đó bấm tải lại.
          </p>
        )}

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên sản phẩm</th>
                <th>Giá</th>
                <th>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {items.map((product) => (
                <tr key={product.id}>
                  <td>{product.id}</td>
                  <td>{product.name}</td>
                  <td>{formatMoney(product.price)}</td>
                  <td>
                    <div className="actions">
                      <button
                        disabled={busy}
                        onClick={() => handleEdit(product)}
                      >
                        Sửa
                      </button>

                      <button
                        className="danger"
                        disabled={busy}
                        onClick={() => handleDelete(product)}
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {status === "succeeded" && items.length === 0 && (
                <tr>
                  <td colSpan={4}>Chưa có sản phẩm.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}