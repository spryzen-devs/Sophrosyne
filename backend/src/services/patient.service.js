import patientRepository from '../repositories/patient.repository.js';

/**
 * Patient Service
 */
class PatientService {
  /**
   * Create a new patient
   * @param {Object} patientData
   * @param {string} createdBy
   * @returns {Promise<Object>}
   */
  async createPatient(patientData, createdBy) {
    const patientCode = await this._generatePatientCode();

    let { name, firstName, lastName, age, dateOfBirth, ...rest } = patientData;

    // Handle name split / consolidation
    if (name && (!firstName || !lastName)) {
      const parts = name.trim().split(' ');
      firstName = parts[0] || 'Unknown';
      lastName = parts.slice(1).join(' ') || 'Patient';
    } else if (!name && firstName && lastName) {
      name = `${firstName} ${lastName}`;
    }

    // Handle age / dateOfBirth
    let dobDate = dateOfBirth ? new Date(dateOfBirth) : new Date();
    if (age && !dateOfBirth) {
      dobDate = new Date();
      dobDate.setFullYear(dobDate.getFullYear() - age);
    } else if (dateOfBirth && !age) {
      const diffMs = Date.now() - dobDate.getTime();
      const ageDate = new Date(diffMs);
      age = Math.abs(ageDate.getUTCFullYear() - 1970);
    }

    return patientRepository.create({
      ...rest,
      name,
      firstName: firstName || 'Unknown',
      lastName: lastName || 'Patient',
      age: age || 30,
      patientCode,
      createdBy,
      dateOfBirth: dobDate,
    });
  }

  /**
   * Get all patients with filters and pagination
   * @param {Object} query
   * @returns {Promise<Object>}
   */
  async getAllPatients(query) {
    let { page = 1, limit = 10, search, patientCode, firstName, lastName } = query;

    // Ensure page and limit are numbers
    page = parseInt(page, 10) || 1;
    limit = parseInt(limit, 10) || 10;

    const skip = (page - 1) * limit;

    const where = {};

    if (patientCode) {
      where.patientCode = { contains: patientCode, mode: 'insensitive' };
    }

    if (firstName) {
      where.firstName = { contains: firstName, mode: 'insensitive' };
    }

    if (lastName) {
      where.lastName = { contains: lastName, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { patientCode: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await patientRepository.findMany({
      skip,
      take: limit,
      where,
    });

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get patient by ID
   * @param {string} id
   * @returns {Promise<Object>}
   */
  async getPatientById(id) {
    const patient = await patientRepository.findById(id);
    if (!patient) {
      const error = new Error('Patient not found');
      error.statusCode = 404;
      throw error;
    }
    return patient;
  }

  /**
   * Update patient
   * @param {string} id
   * @param {Object} updateData
   * @returns {Promise<Object>}
   */
  async updatePatient(id, updateData) {
    await this.getPatientById(id);

    const data = { ...updateData };
    if (data.dateOfBirth) {
      data.dateOfBirth = new Date(data.dateOfBirth);
    }

    return patientRepository.update(id, data);
  }

  /**
   * Delete patient
   * @param {string} id
   * @returns {Promise<Object>}
   */
  async deletePatient(id) {
    await this.getPatientById(id);
    return patientRepository.delete(id);
  }

  /**
   * Private method to generate patient code (e.g., PAT-0001)
   * @private
   */
  async _generatePatientCode() {
    const lastPatient = await patientRepository.findLastPatient();
    let nextNumber = 1;

    if (lastPatient && lastPatient.patientCode) {
      const lastCode = lastPatient.patientCode;
      const match = lastCode.match(/PAT-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    return `PAT-${nextNumber.toString().padStart(4, '0')}`;
  }
}

export default new PatientService();
