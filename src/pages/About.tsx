import { motion } from 'framer-motion';
import { Target, Lightbulb, Users, Globe, CheckCircle, Award, Heart, Utensils } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';

export default function About() {
  const objectives = [
    {
      icon: <Target className="w-6 h-6 text-emerald-600" />,
      title: "Personalized Nutrition",
      description: "Deliver AI-powered, scientifically-backed meal plans tailored to individual health goals, dietary preferences, and lifestyle factors."
    },
    {
      icon: <Heart className="w-6 h-6 text-red-600" />,
      title: "Holistic Wellness",
      description: "Integrate nutrition planning with exercise recommendations to promote comprehensive physical and mental well-being."
    },
    {
      icon: <Globe className="w-6 h-6 text-blue-600" />,
      title: "Global Accessibility",
      description: "Make evidence-based nutrition guidance accessible to people of all economic backgrounds, supporting UN SDG goals."
    },
    {
      icon: <Utensils className="w-6 h-6 text-orange-600" />,
      title: "Sustainable Eating",
      description: "Promote sustainable food choices that benefit both individual health and environmental conservation."
    }
  ];

  const innovations = [
    {
      title: "Advanced AI Integration",
      description: "Leveraging Google's Gemini AI to generate contextually aware, culturally appropriate meal recommendations.",
      impact: "Delivers highly personalized plans that adapt to local food availability and cultural preferences."
    },
    {
      title: "Scientific Accuracy",
      description: "Uses the validated Mifflin-St Jeor equation for precise TDEE calculations and evidence-based macronutrient ratios.",
      impact: "Ensures nutritional recommendations are scientifically sound and medically appropriate."
    },
    {
      title: "Athlete-Specific Planning",
      description: "Tailored recommendations for different sports and training regimens, from recreational fitness to competitive athletics.",
      impact: "Optimizes performance and recovery through sport-specific nutrition and training protocols."
    },
    {
      title: "Budget-Conscious Design",
      description: "Prioritizes affordable, locally-available ingredients while maintaining nutritional quality and variety.",
      impact: "Makes healthy eating accessible regardless of economic status, supporting food security goals."
    }
  ];

  const feasibilityFactors = [
    {
      category: "Technical Feasibility",
      points: [
        "Modern web technologies (React, TypeScript, Tailwind CSS)",
        "Robust API integrations with proven platforms",
        "Progressive Web App capabilities for offline access",
        "Scalable cloud infrastructure on Vercel/AWS"
      ]
    },
    {
      category: "Market Readiness",
      points: [
        "Growing demand for personalized health solutions",
        "Increasing awareness of nutrition's role in wellness",
        "Rising adoption of AI-powered health applications",
        "Strong market validation from existing competitors"
      ]
    },
    {
      category: "User Experience",
      points: [
        "Intuitive, mobile-first design approach",
        "Comprehensive accessibility compliance",
        "Multi-language support capabilities",
        "Offline functionality for underserved areas"
      ]
    },
    {
      category: "Sustainability",
      points: [
        "Alignment with UN Sustainable Development Goals",
        "Focus on locally-sourced, affordable ingredients",
        "Educational components promoting long-term habits",
        "Community features to support user engagement"
      ]
    }
  ];

  const uniqueFactors = [
    "First nutrition app to specifically address UN SDG-2 (Zero Hunger) and SDG-3 (Good Health)",
    "AI-powered meal planning with focus on budget-friendly, local ingredients",
    "Comprehensive athlete-specific nutrition protocols for multiple sports",
    "Integration of mental health considerations with nutrition planning",
    "Progressive Web App design enabling global accessibility, even in low-connectivity areas"
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
              About NutriGuide
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Revolutionizing personal nutrition through AI-powered planning, scientific precision, 
              and a commitment to global health equity.
            </p>
          </div>

          {/* Mission Statement */}
          <Card className="mb-12 bg-gradient-to-r from-emerald-50 to-blue-50">
            <CardContent className="text-center py-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
              <p className="text-lg text-gray-700 leading-relaxed max-w-4xl mx-auto">
                To democratize access to personalized, scientifically-backed nutrition guidance by leveraging 
                artificial intelligence, making optimal health achievable for everyone regardless of their 
                background, location, or economic status.
              </p>
            </CardContent>
          </Card>

          {/* Project Objectives */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Project Objectives</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {objectives.map((objective, index) => (
                <motion.div
                  key={objective.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card className="h-full">
                    <CardContent>
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          {objective.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900 mb-2">
                            {objective.title}
                          </h3>
                          <p className="text-gray-600">{objective.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Innovative Solutions */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Innovative Solutions</h2>
            <div className="space-y-6">
              {innovations.map((innovation, index) => (
                <motion.div
                  key={innovation.title}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card>
                    <CardContent>
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                        <div className="lg:col-span-2">
                          <h3 className="font-semibold text-lg text-gray-900 mb-2">
                            {innovation.title}
                          </h3>
                          <p className="text-gray-600 mb-3">{innovation.description}</p>
                        </div>
                        <div className="lg:col-span-1">
                          <div className="bg-emerald-50 rounded-lg p-4">
                            <h4 className="font-medium text-emerald-800 mb-2">Impact:</h4>
                            <p className="text-sm text-emerald-700">{innovation.impact}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Feasibility Analysis */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Feasibility Analysis</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {feasibilityFactors.map((factor, index) => (
                <motion.div
                  key={factor.category}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Lightbulb className="w-5 h-5 text-blue-600" />
                        <span>{factor.category}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {factor.points.map((point, pointIndex) => (
                          <li key={pointIndex} className="flex items-start space-x-2">
                            <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Uniqueness Factors */}
          <section className="mb-12">
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
              <CardHeader>
                <CardTitle className="flex items-center justify-center space-x-2 text-center">
                  <Award className="w-6 h-6 text-purple-600" />
                  <span>What Makes NutriGuide Unique</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {uniqueFactors.map((factor, index) => (
                    <motion.div
                      key={index}
                      className="flex items-start space-x-3"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-purple-600 font-bold text-sm">{index + 1}</span>
                      </div>
                      <p className="text-gray-700 leading-relaxed">{factor}</p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Team & Vision */}
          <section>
            <Card className="text-center bg-gray-900 text-white">
              <CardContent className="py-12">
                <Users className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-4">Our Vision for the Future</h2>
                <p className="text-gray-300 leading-relaxed max-w-3xl mx-auto">
                  We envision a world where optimal nutrition is not a privilege but a fundamental right. 
                  Through continuous innovation in AI technology, community engagement, and partnerships 
                  with global health organizations, NutriGuide will become the leading platform for 
                  democratizing access to personalized nutrition guidance worldwide.
                </p>
              </CardContent>
            </Card>
          </section>
        </motion.div>
      </div>
    </div>
  );
}