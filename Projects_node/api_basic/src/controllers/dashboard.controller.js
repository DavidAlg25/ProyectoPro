import { connect } from '../config/db/connect.js';

class DashboardController {
  
  // =============================================
  // ESTADÍSTICAS GENERALES (panel principal)
  // =============================================
  async getDashboardStats(req, res) {
    try {
      // 1. Ventas hoy
      const [salesToday] = await connect.query(`
        SELECT 
          COUNT(*) as total_orders,
          COALESCE(SUM(order_total_amount), 0) as total_sales,
          COALESCE(AVG(order_total_amount), 0) as average_ticket
        FROM \`order\`
        WHERE DATE(created_at) = CURDATE()
          AND order_status != 'Cancelada'
      `);

      // 2. Ventas del mes
      const [salesMonth] = await connect.query(`
        SELECT 
          COUNT(*) as total_orders,
          COALESCE(SUM(order_total_amount), 0) as total_sales
        FROM \`order\`
        WHERE MONTH(created_at) = MONTH(CURDATE())
          AND YEAR(created_at) = YEAR(CURDATE())
          AND order_status != 'Cancelada'
      `);

      // 3. Productos más vendidos
      const [topProducts] = await connect.query(`
        SELECT 
          p.product_name,
          v.size,
          SUM(od.order_detail_quantity) as total_sold,
          SUM(od.order_detail_quantity * od.order_detail_unit_price) as total_revenue
        FROM orderdetail od
        JOIN productvariants v ON od.variant_FK = v.variant_id
        JOIN products p ON v.product_FK = p.product_id
        JOIN \`order\` o ON od.order_id = o.order_id
        WHERE o.order_status = 'Pagado'
          AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY v.variant_id
        ORDER BY total_sold DESC
        LIMIT 10
      `);

      // 4. Clientes nuevos
      const [newCustomers] = await connect.query(`
        SELECT 
          COUNT(*) as total_new_customers
        FROM customer
        WHERE DATE(created_at) = CURDATE()
      `);

      // 5. Stock bajo (alertas)
      const [lowStock] = await connect.query(`
        SELECT 
          COUNT(*) as total_low_stock,
          JSON_ARRAYAGG(
            JSON_OBJECT(
              'product', p.product_name,
              'size', v.size,
              'stock', i.stock,
              'min_stock', i.min_stock,
              'variant_id', v.variant_id
            )
          ) as products
        FROM inventory i
        JOIN productvariants v ON i.variant_FK = v.variant_id
        JOIN products p ON v.product_FK = p.product_id
        WHERE i.stock <= i.min_stock
      `);

      // 6. Órdenes por estado
      const [ordersByStatus] = await connect.query(`
        SELECT 
          order_status,
          COUNT(*) as count,
          COALESCE(SUM(order_total_amount), 0) as total
        FROM \`order\`
        GROUP BY order_status
      `);

      // 7. Actividad reciente
      const [recentActivity] = await connect.query(`
        (SELECT 
           'orden' as type,
           order_id as id,
           order_status as status,
           order_total_amount as amount,
           created_at,
           created_by
         FROM \`order\`
         ORDER BY created_at DESC
         LIMIT 5)
        UNION ALL
        (SELECT 
           'pago' as type,
           payment_id as id,
           payment_status as status,
           payment_amount as amount,
           created_at,
           created_by
         FROM payment
         ORDER BY created_at DESC
         LIMIT 5)
        UNION ALL
        (SELECT 
           'usuario' as type,
           user_id as id,
           CASE WHEN activated THEN 'activado' ELSE 'registrado' END as status,
           NULL as amount,
           created_at,
           created_by
         FROM user
         ORDER BY created_at DESC
         LIMIT 5)
        ORDER BY created_at DESC
        LIMIT 10
      `);

      // 8. Totales generales
      const [totals] = await connect.query(`
        SELECT 
          (SELECT COUNT(*) FROM user) as total_users,
          (SELECT COUNT(*) FROM customer) as total_customers,
          (SELECT COUNT(*) FROM products WHERE status = 'Activo') as total_products,
          (SELECT COUNT(*) FROM \`order\` WHERE order_status = 'Pagado') as total_completed_orders
      `);

      res.json({
        success: true,
        data: {
          totals: totals[0],
          today: {
            orders: salesToday[0].total_orders,
            sales: salesToday[0].total_sales,
            average_ticket: Math.round(salesToday[0].average_ticket)
          },
          month: {
            orders: salesMonth[0].total_orders,
            sales: salesMonth[0].total_sales
          },
          new_customers: newCustomers[0].total_new_customers,
          low_stock: {
            total: lowStock[0].total_low_stock,
            products: lowStock[0].products || []
          },
          orders_by_status: ordersByStatus,
          top_products: topProducts,
          recent_activity: recentActivity
        }
      });

    } catch (error) {
      console.error('Error en dashboard:', error);
      res.status(500).json({ error: "Error fetching dashboard stats", details: error.message });
    }
  }

  // =============================================
  // REPORTE DE VENTAS (con filtros)
  // =============================================
  async getSalesReport(req, res) {
    try {
      const { startDate, endDate, groupBy = 'day' } = req.query;

      // Validar fechas
      const start = startDate || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0];
      const end = endDate || new Date().toISOString().split('T')[0];

      let groupClause;
      let selectClause;
      
      if (groupBy === 'day') {
        groupClause = 'DATE(created_at)';
        selectClause = 'DATE(created_at) as period';
      } else if (groupBy === 'month') {
        groupClause = 'DATE_FORMAT(created_at, "%Y-%m")';
        selectClause = 'DATE_FORMAT(created_at, "%Y-%m") as period';
      } else if (groupBy === 'year') {
        groupClause = 'YEAR(created_at)';
        selectClause = 'YEAR(created_at) as period';
      }

      const [report] = await connect.query(`
        SELECT 
          ${selectClause},
          COUNT(*) as total_orders,
          COALESCE(SUM(order_total_amount), 0) as total_sales,
          COALESCE(AVG(order_total_amount), 0) as average_ticket,
          COUNT(DISTINCT customer_FK) as unique_customers
        FROM \`order\`
        WHERE DATE(created_at) BETWEEN ? AND ?
          AND order_status = 'Pagado'
        GROUP BY period
        ORDER BY period DESC
      `, [start, end]);

      // Ventas por método de pago
      const [paymentMethods] = await connect.query(`
        SELECT 
          payment_method,
          COUNT(*) as total,
          SUM(payment_amount) as amount
        FROM payment p
        JOIN \`order\` o ON p.order_FK = o.order_id
        WHERE DATE(o.created_at) BETWEEN ? AND ?
        GROUP BY payment_method
      `, [start, end]);

      // Totales del período
      const [totals] = await connect.query(`
        SELECT 
          COUNT(*) as total_orders,
          COALESCE(SUM(order_total_amount), 0) as total_sales,
          COALESCE(AVG(order_total_amount), 0) as average_ticket,
          COUNT(DISTINCT customer_FK) as unique_customers
        FROM \`order\`
        WHERE DATE(created_at) BETWEEN ? AND ?
          AND order_status = 'Pagado'
      `, [start, end]);

      res.json({
        success: true,
        data: {
          period: {
            start,
            end,
            groupBy
          },
          totals: {
            ...totals[0],
            average_ticket: Math.round(totals[0].average_ticket)
          },
          payment_methods: paymentMethods,
          details: report.map(r => ({
            ...r,
            average_ticket: Math.round(r.average_ticket)
          }))
        }
      });

    } catch (error) {
      console.error('Error en reporte de ventas:', error);
      res.status(500).json({ error: "Error generating sales report", details: error.message });
    }
  }

  // =============================================
  // REPORTE DE INVENTARIO
  // =============================================
  async getInventoryReport(req, res) {
    try {
      const [report] = await connect.query(`
        SELECT 
          p.product_id,
          p.product_name,
          v.variant_id,
          v.size,
          i.stock,
          i.min_stock,
          i.max_stock,
          v.unit_price,
          (i.stock * v.unit_price) as inventory_value,
          CASE 
            WHEN i.stock <= i.min_stock THEN 'CRÍTICO'
            WHEN i.stock >= i.max_stock THEN 'EXCESO'
            ELSE 'NORMAL'
          END as status,
          (SELECT COALESCE(SUM(quantity), 0)
           FROM inventorymovement 
           WHERE variant_FK = v.variant_id 
             AND movement_type = 'Salida'
             AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as monthly_sales,
          (SELECT COALESCE(SUM(quantity), 0)
           FROM inventorymovement 
           WHERE variant_FK = v.variant_id 
             AND movement_type = 'Entrada'
             AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as monthly_purchases
        FROM inventory i
        JOIN productvariants v ON i.variant_FK = v.variant_id
        JOIN products p ON v.product_FK = p.product_id
        WHERE i.is_active = 1
        ORDER BY 
          CASE 
            WHEN i.stock <= i.min_stock THEN 0
            WHEN i.stock >= i.max_stock THEN 2
            ELSE 1
          END,
          (i.stock / i.min_stock) ASC
      `);

      const summary = {
        total_value: report.reduce((acc, item) => acc + (item.inventory_value || 0), 0),
        critical: report.filter(i => i.status === 'CRÍTICO').length,
        excess: report.filter(i => i.status === 'EXCESO').length,
        normal: report.filter(i => i.status === 'NORMAL').length,
        total_items: report.length,
        critical_items: report.filter(i => i.status === 'CRÍTICO')
      };

      res.json({
        success: true,
        summary,
        data: report
      });

    } catch (error) {
      console.error('Error en reporte de inventario:', error);
      res.status(500).json({ error: "Error generating inventory report", details: error.message });
    }
  }

  // =============================================
  // REPORTE DE CLIENTES
  // =============================================
  async getCustomersReport(req, res) {
    try {
      const [report] = await connect.query(`
        SELECT 
          c.customer_id,
          c.first_name,
          c.second_name,
          c.first_last_name,
          c.second_last_name,
          u.email,
          u.activated,
          u.created_at as registration_date,
          COUNT(DISTINCT o.order_id) as total_orders,
          COALESCE(SUM(o.order_total_amount), 0) as total_spent,
          MAX(o.created_at) as last_purchase,
          CASE 
            WHEN MAX(o.created_at) >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 'Activo'
            WHEN MAX(o.created_at) >= DATE_SUB(NOW(), INTERVAL 90 DAY) THEN 'Inactivo'
            ELSE 'Perdido'
          END as status
        FROM customer c
        JOIN user u ON c.user_FK = u.user_id
        LEFT JOIN \`order\` o ON c.customer_id = o.customer_FK AND o.order_status = 'Pagado'
        GROUP BY c.customer_id
        ORDER BY total_spent DESC
      `);

      const summary = {
        total_customers: report.length,
        active: report.filter(c => c.status === 'Activo').length,
        inactive: report.filter(c => c.status === 'Inactivo').length,
        lost: report.filter(c => c.status === 'Perdido').length,
        average_spent: report.reduce((acc, c) => acc + c.total_spent, 0) / report.length || 0,
        top_customer: report.length > 0 ? report[0] : null
      };

      res.json({
        success: true,
        summary: {
          ...summary,
          average_spent: Math.round(summary.average_spent)
        },
        data: report
      });

    } catch (error) {
      console.error('Error en reporte de clientes:', error);
      res.status(500).json({ error: "Error generating customers report", details: error.message });
    }
  }

  // =============================================
  // REPORTE DE PROVEEDORES
  // =============================================
  async getSuppliersReport(req, res) {
    try {
      const [report] = await connect.query(`
        SELECT 
          s.supplier_id,
          s.supplier_name,
          s.supplier_email,
          s.supplier_phone,
          s.supplier_status,
          COUNT(DISTINCT po.purchaseOrder_id) as total_orders,
          COALESCE(SUM(po.purchaseOrder_totalAmount), 0) as total_purchases,
          MAX(po.created_at) as last_purchase,
          AVG(po.purchaseOrder_totalAmount) as average_order,
          MIN(po.created_at) as first_purchase
        FROM supplier s
        LEFT JOIN purchaseorder po ON s.supplier_id = po.supplier_FK AND po.purchaseOrder_status = 'Recibida'
        GROUP BY s.supplier_id
        ORDER BY total_purchases DESC
      `);

      const summary = {
        total_suppliers: report.length,
        active: report.filter(s => s.supplier_status === 'Activo').length,
        inactive: report.filter(s => s.supplier_status === 'Inactivo').length,
        total_purchases: report.reduce((acc, s) => acc + s.total_purchases, 0),
        average_per_supplier: report.reduce((acc, s) => acc + s.total_purchases, 0) / report.length || 0
      };

      res.json({
        success: true,
        summary: {
          ...summary,
          average_per_supplier: Math.round(summary.average_per_supplier)
        },
        data: report
      });

    } catch (error) {
      console.error('Error en reporte de proveedores:', error);
      res.status(500).json({ error: "Error generating suppliers report", details: error.message });
    }
  }

  // =============================================
  // REPORTE DE PRODUCTOS
  // =============================================
  async getProductsReport(req, res) {
    try {
      const [report] = await connect.query(`
        SELECT 
          p.product_id,
          p.product_code,
          p.product_name,
          p.status,
          c.category_name,
          COUNT(DISTINCT v.variant_id) as total_variants,
          COALESCE(SUM(i.stock), 0) as total_stock,
          MIN(v.unit_price) as min_price,
          MAX(v.unit_price) as max_price,
          AVG(v.unit_price) as avg_price,
          (SELECT COALESCE(SUM(od.order_detail_quantity), 0)
           FROM orderdetail od
           JOIN productvariants pv ON od.variant_FK = pv.variant_id
           WHERE pv.product_FK = p.product_id) as total_sold
        FROM products p
        LEFT JOIN category c ON p.category_FK = c.category_id
        LEFT JOIN productvariants v ON p.product_id = v.product_FK
        LEFT JOIN inventory i ON v.variant_id = i.variant_FK
        GROUP BY p.product_id
        ORDER BY total_sold DESC
      `);

      const summary = {
        total_products: report.length,
        active: report.filter(p => p.status === 'Activo').length,
        inactive: report.filter(p => p.status === 'Inactivo').length,
        total_stock: report.reduce((acc, p) => acc + p.total_stock, 0),
        top_product: report.length > 0 ? report[0] : null
      };

      res.json({
        success: true,
        summary,
        data: report
      });

    } catch (error) {
      console.error('Error en reporte de productos:', error);
      res.status(500).json({ error: "Error generating products report", details: error.message });
    }
  }

  // =============================================
  // AUDITORÍA (movimientos)
  // =============================================
  async getAuditLog(req, res) {
    try {
      const { limit = 100, type, userId, startDate, endDate } = req.query;

      let queries = [];
      let allParams = [];

      // Movimientos de inventario
      if (!type || type === 'inventory') {
        queries.push(`
          SELECT 
            'inventario' as module,
            inventoryMovement_id as id,
            movement_type as action,
            quantity as value,
            movement_description as description,
            user_FK,
            created_at,
            variant_FK
          FROM inventorymovement
          WHERE 1=1
          ${userId ? 'AND user_FK = ?' : ''}
          ${startDate ? 'AND DATE(created_at) >= ?' : ''}
          ${endDate ? 'AND DATE(created_at) <= ?' : ''}
        `);
        if (userId) allParams.push(userId);
        if (startDate) allParams.push(startDate);
        if (endDate) allParams.push(endDate);
      }

      // Órdenes
      if (!type || type === 'orders') {
        queries.push(`
          SELECT 
            'orden' as module,
            order_id as id,
            order_status as action,
            order_total_amount as value,
            CONCAT('Orden #', order_id) as description,
            created_by as user_FK,
            created_at,
            NULL as variant_FK
          FROM \`order\`
          WHERE 1=1
          ${userId ? 'AND created_by = ?' : ''}
          ${startDate ? 'AND DATE(created_at) >= ?' : ''}
          ${endDate ? 'AND DATE(created_at) <= ?' : ''}
        `);
        if (userId) allParams.push(userId);
        if (startDate) allParams.push(startDate);
        if (endDate) allParams.push(endDate);
      }

      // Pagos
      if (!type || type === 'payments') {
        queries.push(`
          SELECT 
            'pago' as module,
            payment_id as id,
            payment_status as action,
            payment_amount as value,
            CONCAT('Pago ref: ', payment_reference) as description,
            created_by as user_FK,
            created_at,
            NULL as variant_FK
          FROM payment
          WHERE 1=1
          ${userId ? 'AND created_by = ?' : ''}
          ${startDate ? 'AND DATE(created_at) >= ?' : ''}
          ${endDate ? 'AND DATE(created_at) <= ?' : ''}
        `);
        if (userId) allParams.push(userId);
        if (startDate) allParams.push(startDate);
        if (endDate) allParams.push(endDate);
      }

      // Usuarios
      if (!type || type === 'users') {
        queries.push(`
          SELECT 
            'usuario' as module,
            user_id as id,
            CASE WHEN activated THEN 'activado' ELSE 'registrado' END as action,
            NULL as value,
            login as description,
            created_by as user_FK,
            created_at,
            NULL as variant_FK
          FROM user
          WHERE 1=1
          ${userId ? 'AND user_id = ?' : ''}
          ${startDate ? 'AND DATE(created_at) >= ?' : ''}
          ${endDate ? 'AND DATE(created_at) <= ?' : ''}
        `);
        if (userId) allParams.push(userId);
        if (startDate) allParams.push(startDate);
        if (endDate) allParams.push(endDate);
      }

      // Unir todas las consultas
      const unionQuery = queries.join(' UNION ALL ');
      const finalQuery = `${unionQuery} ORDER BY created_at DESC LIMIT ?`;
      allParams.push(parseInt(limit));

      const [logs] = await connect.query(finalQuery, allParams);

      // Resumen por módulo
      const summary = {
        total: logs.length,
        by_module: {}
      };

      logs.forEach(log => {
        if (!summary.by_module[log.module]) {
          summary.by_module[log.module] = 0;
        }
        summary.by_module[log.module]++;
      });

      res.json({
        success: true,
        summary,
        data: logs
      });

    } catch (error) {
      console.error('Error en auditoría:', error);
      res.status(500).json({ error: "Error fetching audit log", details: error.message });
    }
  }

  // =============================================
  // EXPORTAR REPORTE (CSV/Excel ready)
  // =============================================
  async exportReport(req, res) {
    try {
      const { type, format = 'json', startDate, endDate } = req.query;

      let data;
      let filename;

      switch (type) {
        case 'sales':
          data = await this.getSalesData(startDate, endDate);
          filename = 'ventas';
          break;
        case 'inventory':
          data = await this.getInventoryData();
          filename = 'inventario';
          break;
        case 'customers':
          data = await this.getCustomersData();
          filename = 'clientes';
          break;
        case 'products':
          data = await this.getProductsData();
          filename = 'productos';
          break;
        default:
          return res.status(400).json({ error: "Tipo de reporte no válido" });
      }

      // Aquí podrías implementar la generación de CSV/Excel
      // Por ahora devolvemos JSON
      res.json({
        success: true,
        filename: `${filename}_${new Date().toISOString().split('T')[0]}`,
        data
      });

    } catch (error) {
      console.error('Error exportando reporte:', error);
      res.status(500).json({ error: "Error exporting report", details: error.message });
    }
  }

  // Métodos auxiliares para exportación
  async getSalesData(startDate, endDate) {
    const start = startDate || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];

    const [data] = await connect.query(`
      SELECT 
        o.order_id,
        o.created_at as fecha,
        o.order_total_amount as total,
        o.order_status as estado,
        CONCAT(c.first_name, ' ', c.first_last_name) as cliente,
        p.payment_method as metodo_pago
      FROM \`order\` o
      JOIN customer c ON o.customer_FK = c.customer_id
      LEFT JOIN payment p ON o.order_id = p.order_FK
      WHERE DATE(o.created_at) BETWEEN ? AND ?
      ORDER BY o.created_at DESC
    `, [start, end]);

    return data;
  }

  async getInventoryData() {
    const [data] = await connect.query(`
      SELECT 
        p.product_name as producto,
        v.size as talla,
        i.stock as stock_actual,
        i.min_stock as stock_minimo,
        i.max_stock as stock_maximo,
        v.unit_price as precio,
        (i.stock * v.unit_price) as valor_inventario
      FROM inventory i
      JOIN productvariants v ON i.variant_FK = v.variant_id
      JOIN products p ON v.product_FK = p.product_id
      ORDER BY p.product_name, v.size
    `);

    return data;
  }

  async getCustomersData() {
    const [data] = await connect.query(`
      SELECT 
        CONCAT(c.first_name, ' ', c.first_last_name) as nombre,
        u.email,
        u.activated as activo,
        u.created_at as fecha_registro,
        COUNT(DISTINCT o.order_id) as total_compras,
        COALESCE(SUM(o.order_total_amount), 0) as total_gastado
      FROM customer c
      JOIN user u ON c.user_FK = u.user_id
      LEFT JOIN \`order\` o ON c.customer_id = o.customer_FK AND o.order_status = 'Pagado'
      GROUP BY c.customer_id
      ORDER BY total_gastado DESC
    `);

    return data;
  }

  async getProductsData() {
    const [data] = await connect.query(`
      SELECT 
        p.product_code as codigo,
        p.product_name as producto,
        cat.category_name as categoria,
        p.status as estado,
        COUNT(DISTINCT v.variant_id) as total_variantes,
        COALESCE(SUM(i.stock), 0) as stock_total,
        MIN(v.unit_price) as precio_minimo,
        MAX(v.unit_price) as precio_maximo
      FROM products p
      LEFT JOIN category cat ON p.category_FK = cat.category_id
      LEFT JOIN productvariants v ON p.product_id = v.product_FK
      LEFT JOIN inventory i ON v.variant_id = i.variant_FK
      GROUP BY p.product_id
      ORDER BY p.product_name
    `);

    return data;
  }
}

export default new DashboardController();