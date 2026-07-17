document.addEventListener("DOMContentLoaded", () => {

    const ORDER_API_URL = "http://localhost:3000/dispatch-order";

    const ASSIGN_API_URL = "http://localhost:3000/dispatch-assignment";

    
    const pendingBody = document.getElementById("pending-orders-tbody");

    const activeBody = document.getElementById("active-assignments-tbody");

    const completedBody = document.getElementById("completed-orders-tbody");


    const username = localStorage.getItem("ldms_username");

    const role = localStorage.getItem("ldms_role");


    document.getElementById("nav-session-info").innerHTML = `Logged in: ${username} (${role})`;


    document.getElementById("logout-btn").addEventListener("click", () => {

        localStorage.clear();

        window.location.href = "login.html";

    });

    
    let custMap = {};

    let drivMap = {};

    let vehMap = {};


    function getStatusBadge(status) {

        const s = (status || 'Pending').toLowerCase();


        if (s === 'completed' || s === 'delivered') {
            return `<span class="badge-status status-completed">Completed</span>`;
        }


        if (s === 'in transit' || s === 'assigned' || s === 'dispatched' || s === 'in progress') {
            return `<span class="badge-status status-transit">In Transit</span>`;
        }


        return `<span class="badge-status status-pending">Pending</span>`;

    }


    async function loadDashboardData() {

        try {

            const [resCust, resDriv, resVeh] = await Promise.all([
                fetch(`${ORDER_API_URL}/customers`),
                fetch(`${ASSIGN_API_URL}/drivers`),
                fetch(`${ASSIGN_API_URL}/vehicles`)
            ]);

            
            if (resCust.ok) {
                (await resCust.json()).forEach(c => custMap[c.customerId] = c.customerName);
            }


            if (resDriv.ok) {

                const drivers = await resDriv.json();


                drivers.forEach(d => {

                    drivMap[d.driverId] = { name: d.driverName, license: d.licenseNumber };

                });

            }


            if (resVeh.ok) {
                (await resVeh.json()).forEach(v => vehMap[v.vehicleId] = v);
            }


            const resOrders = await fetch(`${ASSIGN_API_URL}/orders`);


            const allOrders = await resOrders.json();


            const pendingList = allOrders.filter(o => o.status && o.status.toLowerCase() === "pending");


            const transitList = allOrders.filter(o => o.status && (o.status.toLowerCase() === "in transit" || o.status.toLowerCase() === "assigned" || o.status.toLowerCase() === "dispatched" || o.status.toLowerCase() === "in progress"));


            const completedList = allOrders.filter(o => o.status && o.status.toLowerCase() === "completed");


            document.getElementById("pending-tab").innerText = `Pending Backlog (${pendingList.length})`;


            document.getElementById("completed-tab").innerText = `Completed Settlements (${completedList.length})`;


            pendingBody.innerHTML = "";


            if (pendingList.length === 0) {

                pendingBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">All orders assigned.</td></tr>`;

            } else {

                pendingList.forEach(o => {

                    const cName = custMap[o.customerId] || 'Unknown Customer';


                    const tr = document.createElement("tr");


                    tr.innerHTML = `
                        <td>Order #${o.orderId}</td>
                        <td>${cName}</td>
                        <td>${o.dispatchDate || 'N/A'}</td>
                        <td>${o.source} &rarr; ${o.destination}</td>
                        <td class="text-center">
                            <a href="dispatch-assignment.html?orderId=${o.orderId}&mode=new" class="btn-action-tag">Assign</a>
                        </td>
                    `;


                    pendingBody.appendChild(tr);

                });

            }


            completedBody.innerHTML = "";


            if (completedList.length === 0) {

                completedBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">No completed dispatches.</td></tr>`;

            } else {

                completedList.forEach(o => {

                    const cName = custMap[o.customerId] || 'Unknown Customer';


                    const tr = document.createElement("tr");


                    tr.innerHTML = `
                        <td>Order #${o.orderId}</td>
                        <td>${cName}</td>
                        <td>${o.source} &rarr; ${o.destination}</td>
                        <td>${getStatusBadge(o.status)}</td>
                        <td class="text-center">
                            <a href="delivery.html?loadOrder=${o.orderId}" class="btn-action-tag">View Log</a>
                        </td>
                    `;


                    completedBody.appendChild(tr);

                });

            }


            await loadOperationalPipeline(allOrders);

        } catch (err) {

            console.error("Dashboard Sync Error:", err);

        }

    }


    async function loadOperationalPipeline(allOrders) {

        activeBody.innerHTML = "";


        let scanId = 0;

        let visibleCount = 0;

        let loopLimit = 0;


        try {

            while (loopLimit < 50) {

                const res = await fetch(`${ASSIGN_API_URL}/next/${scanId}`);


                if (!res.ok) {
                    break;
                }


                const data = await res.json();


                scanId = data.assignmentId;


                loopLimit++;


                const orderData = allOrders.find(o => String(o.orderId) === String(data.orderId));


                const cName = orderData ? (custMap[orderData.customerId] || 'Unknown') : 'Unknown';

                
                const dInfo = drivMap[data.driverId];


                const dNameText = dInfo ? `${dInfo.name} (Lic: ${dInfo.license})` : `Driver #${data.driverId}`;


                const vData = vehMap[data.vehicleId];


                const vText = vData ? `${vData.vehicleNumber} (${vData.capacity} KG)` : `Vehicle #${data.vehicleId}`;


                const statusStr = orderData ? orderData.status : 'Assigned';


                if (statusStr.toLowerCase() === 'completed' || statusStr.toLowerCase() === 'delivered') {
                    continue;
                }


                const tr = document.createElement("tr");


                tr.innerHTML = `
                    <td>Assignment #${data.assignmentId}</td>
                    <td>Order #${data.orderId}<br><span class="text-muted small">${cName}</span></td>
                    <td>${dNameText}</td>
                    <td>${vText}</td>
                    <td class="text-center">
                        <a href="delivery.html?mode=new&orderId=${data.orderId}" class="btn-action-tag">Update</a>
                    </td>
                `;

                
                activeBody.appendChild(tr);


                visibleCount++;

            }


            document.getElementById("transit-tab").innerText = `Active Transits (${visibleCount})`;


            if (visibleCount === 0) {

                activeBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">No active runs in transit.</td></tr>`;

            }

        } catch (err) {

            console.error(err);


            activeBody.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-4">Error loading active pipeline.</td></tr>`;

        }

    }


    loadDashboardData();

});