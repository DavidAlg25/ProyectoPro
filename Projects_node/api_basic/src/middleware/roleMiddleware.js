export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          error: "No autenticado" 
        });
      }

      // Extraer roles del usuario (vienen en el token)
      const userRoles = req.user.roles.map(r => r.role_name);
      
      // Verificar si tiene alguno de los roles permitidos
      const hasPermission = userRoles.some(role => allowedRoles.includes(role));
      
      if (!hasPermission) {
        return res.status(403).json({ 
          error: "Acceso denegado. No tienes los permisos necesarios.",
          requiredRoles: allowedRoles,
          yourRoles: userRoles
        });
      }
      
      next();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
};

// Middleware para clientes (PERMITE que editen su propio perfil)
export const isClient = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "No autenticado" });
    }
    
    const userRoles = req.user.roles.map(r => r.role_name);
    
    // Verificar que sea cliente
    if (!userRoles.includes('cliente')) {
      return res.status(403).json({ 
        error: "Este recurso es solo para clientes" 
      });
    }
    
    next();
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Middleware para verificar que el usuario accede a su propio recurso
export const isSelf = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const userId = parseInt(req.params.id) || req.user.user_id;
    
    if (req.user.user_id !== userId) {
      return res.status(403).json({ 
        error: "Solo puedes modificar tu propio perfil" 
      });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};