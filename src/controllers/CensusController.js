// src/controllers/CensusController.js

const CensusApiService = require('../services/CensusApiService');

class CensusController {
  constructor() {
    this.censusApiService = new CensusApiService();
  }
  
  async getPopulationByState(req, res) {
    try {
      const result = await this.censusApiService.getPopulationByState();
      
      if (result.success) {
        return res.status(200).json({
          success: true,
          data: result.data
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Error in Census controller (population):', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  async getMedianIncomeByState(req, res) {
    try {
      const result = await this.censusApiService.getMedianIncomeByState();
      
      if (result.success) {
        return res.status(200).json({
          success: true,
          data: result.data
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Error in Census controller (income):', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  async getHousingDataByState(req, res) {
    try {
      const result = await this.censusApiService.getHousingDataByState();
      
      if (result.success) {
        return res.status(200).json({
          success: true,
          data: result.data
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Error in Census controller (housing):', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  async getEducationByState(req, res) {
    try {
      const result = await this.censusApiService.getEducationByState();
      
      if (result.success) {
        return res.status(200).json({
          success: true,
          data: result.data
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Error in Census controller (education):', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  async getCountyDataByState(req, res) {
    try {
      const { stateCode } = req.params;
      
      if (!stateCode) {
        return res.status(400).json({
          success: false,
          error: 'State code is required'
        });
      }
      
      const result = await this.censusApiService.getCountyDataByState(stateCode);
      
      if (result.success) {
        return res.status(200).json({
          success: true,
          data: result.data
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Error in Census controller (counties):', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = CensusController;
