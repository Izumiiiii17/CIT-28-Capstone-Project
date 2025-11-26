import emailjs from 'emailjs-com';

class EmailService {
  private serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  private templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  private publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  constructor() {
    // Initialize EmailJS
    if (this.publicKey) {
      emailjs.init(this.publicKey);
    }
  }

  async sendContactForm(formData: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }): Promise<boolean> {
    try {
      if (!this.serviceId || !this.templateId || !this.publicKey) {
        console.warn('EmailJS not configured properly');
        return false;
      }

      const templateParams = {
        from_name: formData.name,
        from_email: formData.email,
        subject: formData.subject,
        message: formData.message,
        to_email: 'syedzane@gmail.com',
        reply_to: formData.email,
      };

      const response = await emailjs.send(
        this.serviceId,
        this.templateId,
        templateParams
      );

      console.log('Email sent successfully:', response);
      return response.status === 200;
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  }

  async sendWelcomeEmail(userEmail: string, userName: string): Promise<boolean> {
    try {
      const templateParams = {
        to_email: userEmail,
        to_name: userName,
        subject: 'Welcome to NutriGuide!',
        message: `Welcome to NutriGuide, ${userName}! We're excited to help you on your nutrition journey. Your personalized diet plans are ready to help you achieve your health goals.`,
      };

      const response = await emailjs.send(
        this.serviceId,
        'template_welcome', // You'd need to create this template in EmailJS
        templateParams
      );

      return response.status === 200;
    } catch (error) {
      console.error('Welcome email failed:', error);
      return false;
    }
  }

  async sendPlanGeneratedEmail(userEmail: string, userName: string, planName: string): Promise<boolean> {
    try {
      const templateParams = {
        to_email: userEmail,
        to_name: userName,
        subject: 'Your New Diet Plan is Ready!',
        message: `Hi ${userName}, your new diet plan "${planName}" has been generated and is ready for you! Log in to your dashboard to start your healthy journey.`,
      };

      const response = await emailjs.send(
        this.serviceId,
        'template_plan_generated',
        templateParams
      );

      return response.status === 200;
    } catch (error) {
      console.error('Plan generated email failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();