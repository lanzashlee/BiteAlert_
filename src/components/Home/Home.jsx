import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);
  
  const carouselRef = useRef(null);
  const headerRef = useRef(null);
  const navigate = useNavigate();

  const slides = [
    {
      title: 'Prevent Animal Bites',
      subtitle: 'Essential Safety Guidelines',
      description: 'Learn how to safely interact with animals and prevent bites through proper behavior and awareness.',
      icon: '🦮',
      tips: ['Always ask permission before petting', 'Never approach unfamiliar animals', 'Stay calm and avoid sudden movements']
    },
    {
      title: 'Recognize Warning Signs',
      subtitle: 'Understanding Animal Behavior',
      description: 'Identify signs of stress, fear, or aggression in animals to avoid dangerous situations.',
      icon: '⚠️',
      tips: ['Watch for raised fur or tail', 'Notice growling or hissing sounds', 'Avoid animals showing teeth']
    },
    {
      title: 'Safe Pet Interaction',
      subtitle: 'Proper Handling Techniques',
      description: 'Master the correct way to approach and interact with pets to ensure everyone stays safe.',
      icon: '🤝',
      tips: ['Let animals sniff your hand first', 'Pet gently on the back or sides', 'Respect when animals want space']
    },
    {
      title: 'Children & Animals',
      subtitle: 'Supervision is Key',
      description: 'Teach children safe practices and always supervise interactions between kids and animals.',
      icon: '👶',
      tips: ['Never leave children alone with pets', 'Teach gentle touch techniques', 'Show proper respect for animals']
    },
    {
      title: 'Emergency Response',
      subtitle: 'What to Do If Bitten',
      description: 'Immediate steps to take if you or someone else is bitten by an animal.',
      icon: '🚨',
      tips: ['Wash wound with soap and water', 'Seek medical attention immediately', 'Report to animal control if needed']
    }
  ];

  // Auto-rotate carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  // Header scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsHeaderScrolled(true);
      } else {
        setIsHeaderScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Navigation Bar */}
      <header 
        ref={headerRef}
        className="fixed top-0 left-0 right-0 z-50 bg-white border-t-4 border-green-800 shadow-lg"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => scrollToSection('home')}>
              <img src="/img/bitealert_logo.svg" alt="BiteAlert Logo" className="h-8 w-8" />
              <span className="text-2xl font-bold text-red-800">BiteAlert</span>
            </div>
            
            {/* Main Navigation Bar - Horizontal */}
            <nav className="flex items-center space-x-8">
              <a 
                href="#home" 
                onClick={(e) => { e.preventDefault(); scrollToSection('home'); }}
                className="text-gray-700 hover:text-red-800 font-medium transition-colors duration-200 px-3 py-2 rounded-md hover:bg-gray-100 cursor-pointer"
              >
                Home
              </a>
              <a 
                href="#welcome" 
                onClick={(e) => { e.preventDefault(); scrollToSection('welcome'); }}
                className="text-gray-700 hover:text-red-800 font-medium transition-colors duration-200 px-3 py-2 rounded-md hover:bg-gray-100 cursor-pointer"
              >
                Welcome
              </a>
              <a 
                href="#about" 
                onClick={(e) => { e.preventDefault(); scrollToSection('about'); }}
                className="text-gray-700 hover:text-red-800 font-medium transition-colors duration-200 px-3 py-2 rounded-md hover:bg-gray-100 cursor-pointer"
              >
                About Us
              </a>
              <a 
                href="#officials" 
                onClick={(e) => { e.preventDefault(); scrollToSection('officials'); }}
                className="text-gray-700 hover:text-red-800 font-medium transition-colors duration-200 px-3 py-2 rounded-md hover:bg-gray-100 cursor-pointer"
              >
                Officials
              </a>
              <a 
                href="#contact" 
                onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}
                className="text-gray-700 hover:text-red-800 font-medium transition-colors duration-200 px-3 py-2 rounded-md hover:bg-gray-100 cursor-pointer"
              >
                Contact
              </a>
            </nav>
            
            {/* Login Button - Right Side */}
            <div className="flex items-center">
              <button 
                onClick={handleLogin}
                className="bg-red-800 text-white px-6 py-2 rounded-full font-semibold hover:bg-red-700 transition-colors duration-200 shadow-md hover:shadow-lg cursor-pointer"
              >
                Login
              </button>
            </div>
            
            {/* Mobile Menu Toggle */}
            <div 
              className="md:hidden flex flex-col space-y-1 cursor-pointer"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <span className="block w-6 h-0.5 bg-gray-600"></span>
              <span className="block w-6 h-0.5 bg-gray-600"></span>
              <span className="block w-6 h-0.5 bg-gray-600"></span>
            </div>
          </div>
          
          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden pb-4 border-t border-gray-200">
              <nav className="flex flex-col space-y-2 pt-4">
                <a 
                  href="#home" 
                  onClick={(e) => { e.preventDefault(); scrollToSection('home'); }}
                  className="text-gray-700 hover:text-red-800 font-medium px-3 py-2 rounded-md hover:bg-gray-100 cursor-pointer"
                >
                  Home
                </a>
                <a 
                  href="#welcome" 
                  onClick={(e) => { e.preventDefault(); scrollToSection('welcome'); }}
                  className="text-gray-700 hover:text-red-800 font-medium px-3 py-2 rounded-md hover:bg-gray-100 cursor-pointer"
                >
                  Welcome
                </a>
                <a 
                  href="#about" 
                  onClick={(e) => { e.preventDefault(); scrollToSection('about'); }}
                  className="text-gray-700 hover:text-red-800 font-medium px-3 py-2 rounded-md hover:bg-gray-100 cursor-pointer"
                >
                  About Us
                </a>
                <a 
                  href="#officials" 
                  onClick={(e) => { e.preventDefault(); scrollToSection('officials'); }}
                  className="text-gray-700 hover:text-red-800 font-medium px-3 py-2 rounded-md hover:bg-gray-100 cursor-pointer"
                >
                  Officials
                </a>
                <a 
                  href="#contact" 
                  onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}
                  className="text-gray-700 hover:text-red-800 font-medium px-3 py-2 rounded-md hover:bg-gray-100 cursor-pointer"
                >
                  Contact
                </a>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Animal Bite Prevention Slideshow */}
      <section id="home" className="pt-24 relative">
        <div className="relative h-screen overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-100 via-orange-50 to-yellow-50">
            {/* Decorative Elements */}
            <div className="absolute top-20 left-20 w-32 h-32 bg-red-200 rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute top-40 right-32 w-24 h-24 bg-orange-200 rounded-full opacity-30 animate-ping"></div>
            <div className="absolute bottom-32 left-1/4 w-20 h-20 bg-yellow-200 rounded-full opacity-25 animate-bounce"></div>
            <div className="absolute bottom-20 right-20 w-28 h-28 bg-red-300 rounded-full opacity-20 animate-pulse"></div>
            
            {/* Paw Print Pattern */}
            <div className="absolute top-1/4 left-1/3 text-red-200 opacity-10 text-6xl transform rotate-12">🐾</div>
            <div className="absolute top-1/3 right-1/4 text-orange-200 opacity-10 text-5xl transform -rotate-12">🐾</div>
            <div className="absolute bottom-1/3 left-1/5 text-yellow-200 opacity-10 text-4xl transform rotate-45">🐾</div>
          </div>
          
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {/* Slide-specific background overlay */}
              <div className={`absolute inset-0 ${
                index === 0 ? 'bg-gradient-to-br from-red-400/20 to-orange-400/20' :
                index === 1 ? 'bg-gradient-to-br from-orange-400/20 to-yellow-400/20' :
                index === 2 ? 'bg-gradient-to-br from-green-400/20 to-blue-400/20' :
                index === 3 ? 'bg-gradient-to-br from-purple-400/20 to-pink-400/20' :
                'bg-gradient-to-br from-red-500/20 to-purple-500/20'
              }`}></div>
              
              <div className="relative z-10 flex items-center justify-center h-full">
                <div className="text-center max-w-5xl mx-auto px-4">
                  {/* Icon with enhanced background */}
                  <div className="inline-block p-8 bg-white/90 backdrop-blur-sm rounded-full shadow-2xl mb-6">
                    <div className="text-8xl animate-bounce">
                      {slide.icon}
                    </div>
                  </div>
                  
                  {/* Title */}
                  <h1 className="text-5xl md:text-6xl font-bold mb-4 text-red-800 drop-shadow-lg">{slide.title}</h1>
                  
                  {/* Subtitle */}
                  <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-orange-600 drop-shadow-md">{slide.subtitle}</h2>
                  
                  {/* Description */}
                  <p className="text-lg md:text-xl mb-8 leading-relaxed text-gray-700 max-w-3xl mx-auto drop-shadow-sm">
                    {slide.description}
                  </p>
                  
                  {/* Tips List with enhanced styling */}
                  <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 mb-8 max-w-2xl mx-auto shadow-2xl border border-white/20">
                    <h3 className="text-xl font-semibold text-red-800 mb-6">Key Tips:</h3>
                    <ul className="space-y-3 text-left">
                      {slide.tips.map((tip, tipIndex) => (
                        <li key={tipIndex} className="flex items-start space-x-4 text-gray-700 p-3 bg-gray-50/50 rounded-lg">
                          <span className="text-red-500 text-xl font-bold">•</span>
                          <span className="font-medium">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Action Button with enhanced styling */}
                  <button 
                    onClick={() => scrollToSection('welcome')}
                    className="bg-gradient-to-r from-red-800 to-red-600 hover:from-red-700 hover:to-red-500 text-white px-10 py-4 rounded-full text-lg font-semibold transition-all duration-300 shadow-2xl hover:shadow-red-500/25 cursor-pointer transform hover:scale-105 hover:-translate-y-1"
                  >
                    Learn More About Prevention
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Carousel Controls */}
        <button 
          className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-800 p-3 rounded-full shadow-lg transition-all duration-200 z-20 cursor-pointer"
          onClick={prevSlide}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button 
          className="absolute top-1/2 right-4 transform -translate-x-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-800 p-3 rounded-full shadow-lg transition-all duration-200 z-20 cursor-pointer"
          onClick={nextSlide}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        
        {/* Carousel Dots */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full transition-all duration-200 cursor-pointer ${
                index === currentSlide ? 'bg-red-800 scale-125' : 'bg-white bg-opacity-60 hover:bg-opacity-100'
              }`}
              onClick={() => goToSlide(index)}
            ></button>
          ))}
        </div>
      </section>

      {/* Welcome Section */}
      <section id="welcome" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-red-800 mb-6">Welcome to BiteAlert</h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                BiteAlert is your trusted partner in rabies prevention and pet health care. 
                We provide comprehensive services to ensure the safety and well-being of your 
                beloved pets and your community.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 bg-red-800 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <span className="font-semibold text-gray-800">Rabies Prevention</span>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 bg-red-800 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <span className="font-semibold text-gray-800">Veterinary Care</span>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 bg-red-800 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <span className="font-semibold text-gray-800">Community Health</span>
                </div>
              </div>
            </div>
            <div className="flex justify-center">
              <img src="/img/contact_img.png" alt="Veterinary Care" className="max-w-md rounded-lg shadow-xl" />
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-red-800 text-center mb-12">About Us</h2>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                BiteAlert is dedicated to providing exceptional veterinary care and 
                rabies prevention services. Our team of experienced professionals 
                is committed to ensuring the health and safety of your pets.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                We offer a wide range of services including vaccinations, health 
                check-ups, emergency care, and educational programs to promote 
                responsible pet ownership.
              </p>
            </div>
            <div className="flex justify-center">
              <img src="/img/7620.jpg" alt="Our Clinic" className="max-w-md rounded-lg shadow-xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-red-800 text-center mb-12">Contact Us</h2>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-red-800 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Address</h3>
                  <p className="text-gray-600">123 Veterinary Street, San Juan City, Metro Manila</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-red-800 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Phone</h3>
                  <p className="text-gray-600">+63 2 1234 5678</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-red-800 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Email</h3>
                  <p className="text-gray-600">info@bitealert.com</p>
                </div>
              </div>
            </div>
            <div className="flex justify-center">
              <img src="/img/contact_img.png" alt="Contact Dog" className="max-w-md rounded-lg shadow-xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Officials Section */}
      <section id="officials" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-red-800 text-center mb-12">Our Officials</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-200">
              <img src="/img/doctor_guy 1.png" alt="Official 1" className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-red-100" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Dr. John Smith</h3>
              <p className="text-red-800 font-medium">Chief Veterinarian</p>
            </div>
            <div className="text-center bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-200">
              <img src="/img/doctor_girl 1.png" alt="Official 2" className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-red-100" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Dr. Sarah Johnson</h3>
              <p className="text-red-800 font-medium">Senior Veterinarian</p>
            </div>
            <div className="text-center bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-200">
              <img src="/img/SANJUAN.jpg" alt="Official 3" className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-red-100" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Dr. Michael Brown</h3>
              <p className="text-red-800 font-medium">Veterinary Surgeon</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold text-red-400 mb-4">BiteAlert</h3>
              <p className="text-gray-300">Your trusted partner in rabies prevention and pet health care.</p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-red-400 mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="#home" onClick={(e) => { e.preventDefault(); scrollToSection('home'); }} className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer">Home</a></li>
                <li><a href="#about" onClick={(e) => { e.preventDefault(); scrollToSection('about'); }} className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer">About Us</a></li>
                <li><a href="#contact" onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }} className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold text-red-400 mb-4">Contact Info</h3>
              <p className="text-gray-300 mb-2">Phone: +63 2 1234 5678</p>
              <p className="text-gray-300">Email: info@bitealert.com</p>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8 text-center">
            <p className="text-gray-400">&copy; 2025 BiteAlert. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
