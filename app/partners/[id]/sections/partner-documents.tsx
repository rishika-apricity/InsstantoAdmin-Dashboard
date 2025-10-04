"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  FileText,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertCircle
} from "lucide-react"
import { doc, getDoc, getFirestore } from "firebase/firestore"
import { getFirestoreDb } from "@/lib/firebase" // Adjust this import path to your firebase config

// Initialize Firestore
const db = getFirestoreDb()

interface PartnerDocumentsSectionProps {
  partnerId: string
}

interface DocumentItem {
  name: string
  fieldKey: string
  imagePath: string | null
  status: "verified" | "pending" | "not_uploaded"
}

export function PartnerDocumentsSection({ partnerId }: PartnerDocumentsSectionProps) {
  const [loading, setLoading] = useState(true)
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [error, setError] = useState<string | null>(null)

  // Document field mappings
  const documentFields = [
    { fieldKey: "aadhaarFront", name: "Aadhaar Card (Front)" },
    { fieldKey: "aadhaarBack", name: "Aadhaar Card (Back)" },
    { fieldKey: "panCard", name: "PAN Card" },
    { fieldKey: "photo", name: "Photo" },
    { fieldKey: "certifications", name: "Certifications" },
    { fieldKey: "bankPassbook", name: "Bank Passbook" },
    { fieldKey: "policeVerification", name: "Police Verification" },
    { fieldKey: "certification", name: "Service Certification" },
    { fieldKey: "medicalCertificate", name: "Medical Certificate" },
    { fieldKey: "electricityBill", name: "Electricity Bill" },
    { fieldKey: "rentAgreement", name: "Rent Agreement" },
    { fieldKey: "PartnerSign", name: "Partner Signature" }
  ]

  useEffect(() => {
    fetchPartnerDocuments()
  }, [partnerId])

  const fetchPartnerDocuments = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch partner document from form_details collection
      const partnerDocRef = doc(db, "form_details", partnerId)
      const partnerDocSnap = await getDoc(partnerDocRef)

      if (!partnerDocSnap.exists()) {
        setError("Partner document not found")
        setDocuments([])
        return
      }

      const partnerData = partnerDocSnap.data()

      // Map document fields to DocumentItem array
      const documentList: DocumentItem[] = documentFields.map(field => {
        const imagePath = partnerData[field.fieldKey]
        
        return {
          name: field.name,
          fieldKey: field.fieldKey,
          imagePath: imagePath || null,
          status: imagePath ? "verified" : "not_uploaded"
        }
      })

      setDocuments(documentList)
    } catch (err) {
      console.error("Error fetching partner documents:", err)
      setError("Failed to fetch partner documents")
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        )
      case 'pending':
        return (
          <Badge variant="outline" className="border-yellow-300 text-yellow-700">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
      case 'not_uploaded':
        return (
          <Badge variant="secondary">
            <XCircle className="w-3 h-3 mr-1" />
            Not Uploaded
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const handleViewDocument = (imagePath: string) => {
    if (imagePath) {
      window.open(imagePath, '_blank', 'noopener,noreferrer')
    }
  }

  const documentStats = {
    total: documents.length,
    verified: documents.filter(d => d.status === 'verified').length,
    pending: documents.filter(d => d.status === 'pending').length,
    notUploaded: documents.filter(d => d.status === 'not_uploaded').length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-lg">Loading documents...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-red-800">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Document Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold">{documentStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Verified</p>
                <p className="text-2xl font-bold">{documentStats.verified}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold">{documentStats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Not Uploaded</p>
                <p className="text-2xl font-bold">{documentStats.notUploaded}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Document Verification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Document Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {documents.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                        No documents found
                      </td>
                    </tr>
                  ) : (
                    documents.map((doc) => (
                      <tr key={doc.fieldKey} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                          {doc.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(doc.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDocument(doc.imagePath!)}
                            disabled={!doc.imagePath}
                            className="gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}