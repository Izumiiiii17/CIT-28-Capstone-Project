import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Phone, MapPin, Send, MessageCircle, Clock, CheckCircle } from 'lucide-react';
// ✅ REMOVED: import { emailService } from '../services/emailService';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import toast from 'react-hot-toast';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function Contact() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
    },
  });

  // ✅ FIXED: Clean Formspree handleSubmit
  const handleSubmit = async (data: ContactFormData) => {
    setLoading(true);
    
    try {
      // 👇 REPLACE "your_actual_form_id" WITH YOUR REAL FORMSPREE ID (e.g., "abc123def")
      const response = await fetch('https://formspree.io/f/xpwyrbnn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setSubmittedEmail(data.email);
        setIsSubmitted(true);
        toast.success('Message sent successfully! We\'ll get back to you soon.');
        form.reset();
      } else {
        const errorText = await response.text();
        console.error('Formspree error:', errorText);
        toast.error('Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Network error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = [
    {
      icon: <Mail className="w-6 h-6 text-emerald-600" />,
      title: 'Email',
      content: 'syedzane@gmail.com',
      description: 'Send us an email anytime'
    },
    {
      icon: <Phone className="w-6 h-6 text-blue-600" />,
      title: 'Phone',
      content: '+91 9876543210',
      description: 'Mon-Fri from 9am to 6pm IST'
    },
    {
      icon: <MapPin className="w-6 h-6 text-orange-600" />,
      title: 'Office',
      content: 'Presidency University Bangalore',
      description: 'Visit our headquarters'
    },
  ];

  const faqItems = [
    {
      question: 'How accurate are the AI-generated meal plans?',
      answer: 'Our meal plans are generated using scientifically-validated algorithms and the latest nutrition research. They are designed to meet your specific caloric and macronutrient needs based on proven calculations like the Mifflin-St Jeor equation.'
    },
    {
      question: 'Can I modify my dietary preferences after creating my profile?',
      answer: 'Absolutely! You can update your dietary preferences, allergies, fitness goals, and other profile information at any time. Your meal plans will automatically adjust to reflect these changes.'
    },
    {
      question: 'Is NutriGuide suitable for people with medical conditions?',
      answer: 'While NutriGuide provides evidence-based nutrition guidance, we always recommend consulting with healthcare professionals for medical conditions. Our platform can complement professional medical advice but should not replace it.'
    },
    {
      question: 'How does the SMS notification system work?',
      answer: 'Once you provide your phone number and enable SMS notifications, you\'ll receive timely reminders for meals, progress updates, and motivational messages. You can customize notification preferences in your dashboard settings.'
    },
    {
      question: 'Can I save multiple diet plans?',
      answer: 'Yes! You can create and save multiple diet plans for different goals or time periods. Switch between them easily from your dashboard and track progress for each plan separately.'
    },
    {
      question: 'What happens to my data if I stop using the app?',
      answer: 'Your data is stored locally on your device and can be exported at any time. We respect your privacy and you have full control over your personal information and diet plans.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Get in Touch
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Have questions about NutriGuide? We'd love to hear from you. 
              Send us a message and we'll respond as soon as possible.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Information */}
            <div className="space-y-6">
              {contactInfo.map((info, index) => (
                <motion.div
                  key={info.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card>
                    <CardContent>
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          {info.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900 mb-1">
                            {info.title}
                          </h3>
                          <p className="text-gray-900 font-medium mb-1">{info.content}</p>
                          <p className="text-sm text-gray-600">{info.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}

              {/* Response Time */}
              <Card className="bg-emerald-50 border-emerald-200">
                <CardContent>
                  <div className="flex items-center space-x-3">
                    <Clock className="w-6 h-6 text-emerald-600" />
                    <div>
                      <h3 className="font-semibold text-emerald-800">Response Time</h3>
                      <p className="text-sm text-emerald-700">
                        We typically respond within 24 hours during business days.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageCircle className="w-5 h-5 text-emerald-600" />
                    <span>Send us a Message</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isSubmitted ? (
                    <motion.div
                      className="text-center py-8"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-emerald-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Message Sent Successfully!
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Thank you for contacting us. We'll get back to you as soon as possible at{' '}
                        <span className="font-medium text-emerald-700">{submittedEmail}</span>.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsSubmitted(false);
                          form.reset();
                        }}
                      >
                        Send Another Message
                      </Button>
                    </motion.div>
                  ) : (
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          {...form.register('name')}
                          label="Full Name"
                          placeholder="Your full name"
                          error={form.formState.errors.name?.message}
                        />

                        <Input
                          {...form.register('email')}
                          type="email"
                          label="Email Address"
                          placeholder="your@email.com"
                          error={form.formState.errors.email?.message}
                        />
                      </div>

                      <Input
                        {...form.register('subject')}
                        label="Subject"
                        placeholder="What is this regarding?"
                        error={form.formState.errors.subject?.message}
                      />

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Message
                        </label>
                        <textarea
                          {...form.register('message')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                          rows={6}
                          placeholder="Tell us more about your question or feedback..."
                        />
                        {form.formState.errors.message && (
                          <p className="text-sm text-red-600 mt-1">
                            {form.formState.errors.message.message}
                          </p>
                        )}
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800">
                          <strong>Note:</strong> All messages will be sent directly to syedzane@gmail.com. 
                          We aim to respond within 24 hours during business days.
                        </p>
                      </div>

                      <Button
                        type="submit"
                        className="w-full"
                        size="lg"
                        isLoading={loading}
                      >
                        Send Message
                        <Send className="w-4 h-4 ml-2" />
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* FAQ Section */}
          <section className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
              Frequently Asked Questions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {faqItems.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card>
                    <CardContent>
                      <h3 className="font-semibold text-lg text-gray-900 mb-3">
                        {item.question}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {item.answer}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Additional Contact Info */}
          <section className="mt-16">
            <Card className="bg-gradient-to-r from-emerald-50 to-blue-50">
              <CardContent className="text-center py-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Need Immediate Assistance?
                </h3>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  For urgent matters or technical support, you can reach us directly at syedzane@gmail.com. 
                  We're committed to helping you succeed on your nutrition journey.
                </p>
              </CardContent>
            </Card>
          </section>
        </motion.div>
      </div>
    </div>
  );
}