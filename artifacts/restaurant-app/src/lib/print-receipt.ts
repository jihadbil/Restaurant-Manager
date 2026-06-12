export function printReceipt(order: any, type: 'customer' | 'kitchen') {
  // Create hidden print area
  let printArea = document.getElementById('print-area');
  if (!printArea) {
    printArea = document.createElement('div');
    printArea.id = 'print-area';
    document.body.appendChild(printArea);
  }

  // Add print styles to head if not exists
  let printStyle = document.getElementById('print-style');
  if (!printStyle) {
    printStyle = document.createElement('style');
    printStyle.id = 'print-style';
    printStyle.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        #print-area, #print-area * {
          visibility: visible;
        }
        #print-area {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          max-width: 300px; /* 80mm thermal receipt */
          font-family: monospace;
          font-size: 12px;
          margin: 0;
          padding: 0;
        }
        @page {
          margin: 0;
        }
      }
    `;
    document.head.appendChild(printStyle);
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
    } catch {
      return dateStr;
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  const getTypeString = (type: number) => {
    switch(type) {
      case 0: return 'Dine In';
      case 1: return 'Takeout';
      case 2: return 'Delivery';
      default: return 'Unknown';
    }
  };

  let html = '';

  if (type === 'customer') {
    html = `
      <div style="text-align: center; margin-bottom: 10px;">
        =========================<br/>
        <b>Oven & Scale</b><br/>
        =========================
      </div>
      <div>Order #${order.orderNumber}</div>
      <div>Date: ${order.date ? formatDate(order.date) : '-'}</div>
      <div>Cashier: ${order.userName || '-'}</div>
      <div>Payment: ${order.paymentMethodName || '-'}</div>
      <div>Type: ${getTypeString(order.orderType)}</div>
      <div style="margin: 10px 0;">-------------------------</div>
      <table style="width: 100%; font-size: 12px; text-align: left;">
        <thead>
          <tr>
            <th>ITEM</th>
            <th style="text-align: right;">QTY</th>
            <th style="text-align: right;">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          ${(order.orderItems || []).map((item: any) => `
            <tr>
              <td>${item.productName}</td>
              <td style="text-align: right;">${item.quantity}</td>
              <td style="text-align: right;">${formatCurrency(item.total || 0)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div style="margin: 10px 0;">-------------------------</div>
      <div style="display: flex; justify-content: space-between;">
        <span>Subtotal:</span>
        <span>${formatCurrency((order.total || 0) + (order.discount || 0))}</span>
      </div>
      ${order.discount > 0 ? `
        <div style="display: flex; justify-content: space-between;">
          <span>Discount:</span>
          <span>-${formatCurrency(order.discount)}</span>
        </div>
      ` : ''}
      <div style="display: flex; justify-content: space-between; font-weight: bold; margin-top: 5px;">
        <span>TOTAL:</span>
        <span>${formatCurrency(order.total || 0)}</span>
      </div>
      <div style="text-align: center; margin-top: 15px;">
        =========================<br/>
        Thank you!<br/>
        =========================
      </div>
    `;
  } else if (type === 'kitchen') {
    html = `
      <div style="text-align: center; margin-bottom: 10px;">
        =========================<br/>
        <b>KITCHEN TICKET</b><br/>
        =========================
      </div>
      <div>Order #${order.orderNumber}</div>
      <div>Type: ${getTypeString(order.orderType)}</div>
      <div>Time: ${order.date ? formatTime(order.date) : '-'}</div>
      <div style="margin: 10px 0;">-------------------------</div>
      <div style="margin-bottom: 10px;">
        ${(order.orderItems || []).map((item: any) => `
          <div style="margin-bottom: 5px; font-weight: bold; font-size: 14px;">
            ${item.productName} x${item.quantity}
          </div>
          ${item.notes ? `<div style="margin-left: 10px;">Notes: ${item.notes}</div>` : ''}
        `).join('')}
      </div>
      <div style="text-align: center; margin-top: 15px;">
        =========================
      </div>
    `;
  }

  printArea.innerHTML = html;

  // Print
  window.print();

  // Cleanup
  document.body.removeChild(printArea);
}
