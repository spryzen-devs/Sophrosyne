import patientService from '../services/patient.service.js';

/**
 * Patient Controller
 */
class PatientController {
  /**
   * Create a new patient
   * @param {Request} req
   * @param {Response} res
   * @param {NextFunction} next
   */
  async createPatient(req, res, next) {
    try {
      const patient = await patientService.createPatient(req.body, req.user.userId);
      res.status(201).json({
        success: true,
        message: 'Patient created successfully',
        data: patient,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all patients with filters and pagination
   * @param {Request} req
   * @param {Response} res
   * @param {NextFunction} next
   */
  async getAllPatients(req, res, next) {
    try {
      const data = await patientService.getAllPatients(req.query, req.user);
      res.status(200).json({
        success: true,
        ...data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get patient by ID
   * @param {Request} req
   * @param {Response} res
   * @param {NextFunction} next
   */
  async getPatientById(req, res, next) {
    try {
      const patient = await patientService.getPatientById(req.params.id);
      res.status(200).json({
        success: true,
        data: patient,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update patient
   * @param {Request} req
   * @param {Response} res
   * @param {NextFunction} next
   */
  async updatePatient(req, res, next) {
    try {
      const patient = await patientService.updatePatient(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Patient updated successfully',
        data: patient,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete patient
   * @param {Request} req
   * @param {Response} res
   * @param {NextFunction} next
   */
  async deletePatient(req, res, next) {
    try {
      await patientService.deletePatient(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Patient deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new PatientController();
