import React, { useState } from 'react';
import { Lightbulb, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DeductionSuggestions from '../components/DeductionSuggestions';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const suggestionSchema = z.object({
  grossSalary: z.coerce.number().min(0, 'Salary must be positive'),
  section80c: z.coerce.number().min(0).max(150000).optional(),
  section80d: z.coerce.number().min(0).max(25000).optional(),
  nps: z.coerce.number().min(0).max(50000).optional(),
  age: z.coerce.number().min(18).max(100).optional(),
  hasHealthInsurance: z.boolean().optional(),
  hasHomeLoan: z.boolean().optional(),
  isRenting: z.boolean().optional(),
  hasParents: z.boolean().optional(),
  parentsAge: z.coerce.number().min(0).max(120).optional()
});

const TaxSavingSuggestions = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(suggestionSchema),
    defaultValues: {
      grossSalary: 0,
      section80c: 0,
      section80d: 0,
      nps: 0,
      age: 30,
      hasHealthInsurance: false,
      hasHomeLoan: false,
      isRenting: false,
      hasParents: false,
      parentsAge: 0
    }
  });

  const onSubmit = (data) => {
    setUserData({
      grossSalary: data.grossSalary,
      currentDeductions: {
        section80c: data.section80c,
        section80d: data.section80d,
        nps: data.nps
      },
      age: data.age,
      hasHealthInsurance: data.hasHealthInsurance,
      hasHomeLoan: data.hasHomeLoan,
      isRenting: data.isRenting,
      hasParents: data.hasParents,
      parentsAge: data.parentsAge
    });
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center text-blue-600 hover:text-blue-700 font-medium"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back
      </button>

      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-4 flex items-center justify-center">
          <Lightbulb className="h-10 w-10 text-yellow-500 mr-3" />
          AI-Powered Tax Saving Suggestions
        </h1>
        <p className="text-xl text-gray-600">
          Discover personalized ways to reduce your tax liability
        </p>
      </div>

      {!userData ? (
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Tell us about yourself</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Annual Gross Salary (₹) *
              </label>
              <input
                type="number"
                {...register('grossSalary')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="800000"
              />
              {errors.grossSalary && (
                <p className="text-red-500 text-sm mt-1">{errors.grossSalary.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Section 80C (₹)
                </label>
                <input
                  type="number"
                  {...register('section80c')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Section 80D (₹)
                </label>
                <input
                  type="number"
                  {...register('section80d')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  NPS Contribution (₹)
                </label>
                <input
                  type="number"
                  {...register('nps')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Age
                </label>
                <input
                  type="number"
                  {...register('age')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="30"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register('hasHealthInsurance')}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
                />
                <span className="ml-3 text-gray-700">I have health insurance</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register('hasHomeLoan')}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
                />
                <span className="ml-3 text-gray-700">I have a home loan</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register('isRenting')}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
                />
                <span className="ml-3 text-gray-700">I live in a rented house</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register('hasParents')}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
                />
                <span className="ml-3 text-gray-700">My parents are dependent on me</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Get Personalized Suggestions
            </button>
          </form>
        </div>
      ) : (
        <div>
          <DeductionSuggestions userData={userData} />
          <div className="text-center mt-8">
            <button
              onClick={() => setUserData(null)}
              className="bg-gray-500 text-white py-3 px-8 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
            >
              Update Information
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaxSavingSuggestions;
