import authService from '../services/auth.service.js';

/**
 * Authentication Controller
 */
class AuthController {
  /**
   * Register a new user
   * @param {Request} req
   * @param {Response} res
   * @param {NextFunction} next
   */
  async register(req, res, next) {
    try {
      const user = await authService.register(req.body);
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Register a new doctor (Admin only)
   * @param {Request} req
   * @param {Response} res
   * @param {NextFunction} next
   */
  async registerDoctor(req, res, next) {
    try {
      const doctorData = { ...req.body, role: 'DOCTOR' };
      const doctor = await authService.register(doctorData);
      res.status(201).json({
        success: true,
        message: 'Doctor created successfully',
        data: doctor,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all registered doctors
   * @param {Request} req
   * @param {Response} res
   * @param {NextFunction} next
   */
  async getDoctors(req, res, next) {
    try {
      const doctors = await authService.getDoctors();
      res.status(200).json({
        success: true,
        data: doctors,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user
   * @param {Request} req
   * @param {Response} res
   * @param {NextFunction} next
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const data = await authService.login(email, password);
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user profile
   * @param {Request} req
   * @param {Response} res
   * @param {NextFunction} next
   */
  async getMe(req, res, next) {
    try {
      const user = await authService.getMe(req.user.userId);
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
