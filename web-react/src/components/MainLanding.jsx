// import React from "react";

const MainLanding = () => {
  const getPath = (fileName) => {
    if (window.location.port === "5173") {
      return `http://localhost:3000/Web/${fileName}`;
    }
    return `/Web/${fileName}`;
  };

  const boardMatrix = [
    {
      title: "Master Entry",
      badge: "3 Masters",
      colorClass: "border-sky-500",
      headerBg: "bg-sky-600",
      bgTint: "bg-sky-50",
      bgHover: "hover:bg-sky-100",
      items: [
        {
          name: "Customer Master",
          desc: "Customer information & details",
          path: "customer.html",
        },
        {
          name: "Vehicle Master",
          desc: "Vehicle details & availability",
          path: "vehicle.html",
        },
        {
          name: "Driver Master",
          desc: "Driver information & license",
          path: "driver.html",
        },
      ],
    },
    {
      title: "Transactions",
      badge: "3 Forms",
      colorClass: "border-emerald-600",
      headerBg: "bg-emerald-700",
      bgTint: "bg-emerald-50",
      bgHover: "hover:bg-emerald-100",
      items: [
        {
          name: "Dispatch Order",
          desc: "Create order with source & destination",
          path: "dispatchOrder.html",
        },
        {
          name: "Dispatch Assignment",
          desc: "Assign vehicle & driver to order",
          path: "dispatch-assignment.html",
        },
        {
          name: "Delivery Confirmation",
          desc: "Capture delivery date & remarks",
          path: "delivery.html",
        },
      ],
    },
    {
      title: "Dashboards",
      badge: "3 Views",
      colorClass: "border-purple-600",
      headerBg: "bg-purple-700",
      bgTint: "bg-purple-50",
      bgHover: "hover:bg-purple-100",
      items: [
        {
          name: "Admin Dashboard",
          desc: "System overview & key metrics",
          path: "admin-dashboard.html",
        },
        {
          name: "Dispatcher Board",
          desc: "Live order & assignment controls",
          path: "dispatcher-dashboard.html",
        },
        {
          name: "Driver Console",
          desc: "View assignments & update delivery status",
          path: "driver-dashboard.html",
        },
      ],
    },
    {
      title: "Reports",
      badge: "5 Reports",
      colorClass: "border-amber-600",
      headerBg: "bg-amber-700",
      bgTint: "bg-amber-50",
      bgHover: "hover:bg-amber-100",
      items: [
        {
          name: "Dispatch Report",
          desc: "Full dispatch history & summary",
          path: "#",
        },
        {
          name: "Delivery Report",
          desc: "Completed deliveries & confirmation log",
          path: "#",
        },
        {
          name: "Pending Orders Report",
          desc: "Outstanding & unassigned orders",
          path: "#",
        },
        {
          name: "Vehicle Utilization Report",
          desc: "Fleet usage & availability analysis",
          path: "#",
        },
        {
          name: "Driver Assignment Report",
          desc: "Driver-wise assignment & trip summary",
          path: "#",
        },
      ],
    },
    {
      title: "Processing",
      badge: "5 Jobs",
      colorClass: "border-teal-600",
      headerBg: "bg-teal-700",
      bgTint: "bg-teal-50",
      bgHover: "hover:bg-teal-100",
      items: [
        {
          name: "Status Update Processing",
          desc: "Bulk update Pending → Dispatched → Delivered",
          path: "#",
        },
        {
          name: "Delivery Confirmation",
          desc: "Process & finalize delivery records",
          path: "#",
        },
        {
          name: "Auto Assignment Processing",
          desc: "Auto-match available drivers & vehicles",
          path: "#",
        },
        {
          name: "Audit Log Processing",
          desc: "Capture created/updated timestamps & trail",
          path: "#",
        },
        {
          name: "Data Archival",
          desc: "Archive completed & old dispatch records",
          path: "#",
        },
      ],
    },
  ];

  return (
    <div>
      <main className="w-full px-4 py-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 items-start">
          {boardMatrix.map((column, idx) => (
            
            <section
              key={idx}
              className={`flex flex-col h-full min-h-[85vh] rounded-lg border bg-white shadow-sm overflow-hidden ${column.colorClass}`}
            >
              <div
                className={`${column.headerBg} text-white px-4 py-3 flex justify-between items-center shadow-sm`}
              >
                <h3 className="font-bold text-sm tracking-wide uppercase font-sans">
                  {column.title}
                </h3>
                <span className="text-[10px] bg-white/20 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {column.badge}
                </span>
              </div>


              <div className={`flex-grow flex flex-col divide-y divide-slate-100 ${column.bgTint}`}>
              {column.items.map((item, itemIdx) => {
                
                let bg = "bg-white"
                if (itemIdx % 2 == 0) {
                    bg = item.bgTint;
                }
                return (
                  <a
                    key={itemIdx}
                    href={item.path.startsWith("#") ? item.path : getPath(item.path)}
                    className={`group p-4 flex gap-3 ${bg} ${column.bgHover} no-underline transition-colors duration-200`}
                  >
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">
                        {item.name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                  </a>
                );
              })}
            </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
};

export default MainLanding;
