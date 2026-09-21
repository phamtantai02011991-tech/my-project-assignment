# Hướng dẫn Kiểm tra và Đánh giá Đồ án PRAM

Kính gửi Thầy Cô, dưới đây là thông tin tài khoản dùng thử và luồng nghiệp vụ chi tiết của hệ thống **Employee Transfer Workflow (Điều chuyển nhân sự)** để Thầy Cô tiện việc thao tác và chấm điểm.

---

## 1. Thông tin Đăng nhập (Tài khoản mẫu)
Hệ thống đã được thiết lập sẵn 5 tài khoản tương ứng với các phân quyền khác nhau. **Mật khẩu chung cho tất cả các tài khoản là: `Pass@123`**

| Vai trò (Role) | Email Đăng nhập | Tên Nhân Viên | Mô tả |
| :--- | :--- | :--- | :--- |
| **Admin/CEO** | `admin@enterprise.com` | Phạm Văn E | Quản trị tối cao, duyệt quyết định cuối cùng |
| **HR** | `hr@enterprise.com` | Lê Thị C | Tạo và quản lý quy trình điều chuyển |
| **Manager (Tech)** | `manager@enterprise.com` | Trần Văn B | Trưởng phòng Kỹ thuật |
| **Manager (Sales)**| `sales_manager@enterprise.com` | Hoàng Văn D | Trưởng phòng Kinh doanh |
| **Employee** | `employee@enterprise.com` | Nguyễn Văn A | Nhân viên bình thường (bị điều chuyển) |

---

## 2. Kịch bản Điều chuyển Nhân sự (Quy trình)

Thầy có thể thực hiện một quy trình điều chuyển hoàn chỉnh qua các bước sau:

1. **Khởi tạo yêu cầu (HR hoặc Manager):**
   - Đăng nhập bằng tài khoản `hr@enterprise.com`.
   - Vào menu "Quản lý điều chuyển", chọn "Tạo mới".
   - Chọn nhân viên *Nguyễn Văn A* (Từ phòng Kỹ thuật sang phòng Kinh doanh).
   - Đặt "Ngày hiệu lực" (Effective Date) là ngày hôm nay hoặc một ngày trong tương lai. Trạng thái lúc này là `PendingApproval` (Chờ duyệt).

2. **Quy trình Duyệt:**
   - Đăng nhập bằng `admin@enterprise.com` (hoặc Manager cấp cao).
   - Vào xem Đơn điều chuyển và bấm **Duyệt (Approve)**.

3. **Cơ chế Thực thi (Trường hợp xảy ra):**
   - **Trường hợp 1: Chuyển ngay lập tức (Ngày hiệu lực = Hôm nay/Quá khứ)**
     Hệ thống sẽ ngay lập tức gạch tên nhân viên khỏi phòng cũ, thêm vào phòng mới, và lưu lịch sử công tác.
   - **Trường hợp 2: Chuyển theo lịch hẹn (Ngày hiệu lực = Tương lai)**
     Trạng thái chuyển thành `Approved`. Hệ thống **chưa** chuyển ngay, mà chờ đến đúng ngày đó, một tiến trình ngầm (Background Worker) sẽ tự động kích hoạt và thực thi việc luân chuyển lúc nửa đêm.

---

## 3. Kiến trúc và Cơ chế Kỹ thuật nổi bật (Dành cho chấm điểm)

Dự án này không chỉ giải quyết bài toán CRUD cơ bản mà còn áp dụng các cơ chế nâng cao:

> [!TIP]
> **3.1. ACID Transactions (Giao dịch bảo toàn Dữ liệu)**
> Khi việc điều chuyển thực thi, hệ thống phải làm 3 việc cùng lúc: 
> *(1) Đổi phòng ban của Employee -> (2) Ghi Lịch sử công tác -> (3) Lưu Audit Log.*
> Tất cả được bọc trong một khối `DbTransaction` của SQLite. Nếu 1 trong 3 thao tác bị lỗi (ví dụ rớt mạng), toàn bộ quá trình sẽ được Rollback lại trạng thái ban đầu, cam kết không bao giờ có rác dữ liệu.

> [!NOTE]
> **3.2. Distributed Caching với Cloud Redis (Upstash)**
> Để tối ưu hiệu năng và giảm tải Database, danh sách nhân viên và sơ đồ phòng ban được lưu tạm vào **Redis Cache** (Sử dụng `StackExchange.Redis` kết nối đến Upstash Cloud). Khi có nhân viên bị luân chuyển, Cache sẽ bị xóa (Invalidate) để tự động cập nhật dữ liệu mới.

> [!IMPORTANT]
> **3.3. Background Task Scheduler (.NET Hosted Service)**
> Hệ thống triển khai một `IHostedService` (TransferSchedulerService) chạy ngầm độc lập với Web API. Cứ mỗi 15 giây, nó sẽ tự động quét cơ sở dữ liệu để tìm các đơn điều chuyển đã đến ngày hiệu lực và âm thầm thực thi chúng mà không cần ai phải bấm nút.

> [!WARNING]
> **3.4. Clean Architecture & Security**
> Code được chia thành các lớp `Controllers - Services - Repositories` lỏng lẻo (Dependency Injection). Mật khẩu được băm (Hash) bằng thư viện **BCrypt**. Bảo mật API hoàn toàn thông qua **JWT Bearer Token** (Intercept trên Axios Frontend).
