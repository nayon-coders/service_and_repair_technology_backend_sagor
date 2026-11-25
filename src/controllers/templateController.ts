import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

const DEFAULT_TEMPLATES = [
  'Display flickering and power supply intermittently shutting down during scan.',
  'Motherboard circuit failure, device completely not powering on (Dead).',
  'Sensor calibration error and optic light intensity malfunction.',
  'Motor drive overheating and mechanical axis movement jammed.',
  'Suction pump pressure low and internal fluidics pipe leakage.',
  'Communication interface error and system freeze during inspection.',
  'Battery backup drained completely, charging circuit not responding.',
  'Control panel touch keypad unresponsive and error code flashing.',
];

const SETTING_KEY = 'fault_problem_templates';

export const getProblemTemplates = async (_req: Request, res: Response): Promise<void> => {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: SETTING_KEY },
    });

    if (!setting || !setting.value) {
      // Seed default templates if not present
      await prisma.systemSetting.upsert({
        where: { key: SETTING_KEY },
        update: { value: JSON.stringify(DEFAULT_TEMPLATES) },
        create: {
          key: SETTING_KEY,
          value: JSON.stringify(DEFAULT_TEMPLATES),
          description: 'Predefined Fault & Problem Description Templates',
        },
      });

      res.status(200).json({
        success: true,
        data: DEFAULT_TEMPLATES,
      });
      return;
    }

    try {
      const parsed = JSON.parse(setting.value);
      res.status(200).json({
        success: true,
        data: Array.isArray(parsed) ? parsed : DEFAULT_TEMPLATES,
      });
    } catch {
      res.status(200).json({
        success: true,
        data: DEFAULT_TEMPLATES,
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve problem templates',
      error: error.message,
    });
  }
};

export const updateProblemTemplates = async (req: Request, res: Response): Promise<void> => {
  try {
    const { templates } = req.body;
    if (!Array.isArray(templates)) {
      res.status(400).json({
        success: false,
        message: 'Templates must be an array of strings',
      });
      return;
    }

    const cleanTemplates = templates
      .map((t) => (typeof t === 'string' ? t.trim() : ''))
      .filter((t) => t.length > 0);

    const updated = await prisma.systemSetting.upsert({
      where: { key: SETTING_KEY },
      update: { value: JSON.stringify(cleanTemplates) },
      create: {
        key: SETTING_KEY,
        value: JSON.stringify(cleanTemplates),
        description: 'Predefined Fault & Problem Description Templates',
      },
    });

    res.status(200).json({
      success: true,
      message: 'Templates updated successfully',
      data: JSON.parse(updated.value),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update problem templates',
      error: error.message,
    });
  }
};
