import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { 
  Camera as CameraIcon, 
  Image as ImageIcon, 
  X, 
  DollarSign,
  Calendar,
  Tag,
  FileText,
  Upload,
  RotateCcw,
  Smartphone,
  Eye
} from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';
import { OCRService, ReceiptData } from '@/services/ocrService';
import { ExchangeRateService } from '@/services/exchangeRateService';
import TransactionModal from './TransactionModal';
import Theme from '@/constants/Theme';

interface ReceiptScannerProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function ReceiptScanner({ isVisible, onClose }: ReceiptScannerProps) {
  const { user } = useAuth();
  const { addTransaction } = useTransactions(user?.id);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedImage, setScannedImage] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showRawText, setShowRawText] = useState(false);
  const [manualData, setManualData] = useState({
    amount: '',
    merchant: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
  });

  // Web platform - show mobile-only message
  if (Platform.OS === 'web') {
    return (
      <Modal visible={isVisible} animationType="slide">
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.title}>Receipt Scanner</Text>
            <View style={styles.placeholder} />
          </View>
          
          <View style={styles.webContainer}>
            <View style={styles.webIcon}>
              <Smartphone size={64} color="#6B7280" />
            </View>
            <Text style={styles.webTitle}>Mobile Only Feature</Text>
            <Text style={styles.webText}>
              The receipt scanner is only available on mobile devices. Please use the mobile app to scan receipts and add transactions.
            </Text>
            <TouchableOpacity style={styles.webButton} onPress={onClose}>
              <Text style={styles.webButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setIsScanning(true);
        setScannedImage(result.assets[0].uri);
        await analyzeReceipt(result.assets[0].base64 || '');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const analyzeReceipt = async (imageBase64: string) => {
    try {
      const receiptData = await OCRService.analyzeReceipt(imageBase64);
      
      setReceiptData(receiptData);
      setManualData({
        amount: receiptData.amount.toString(),
        merchant: receiptData.merchant,
        category: receiptData.category,
        date: receiptData.date,
      });
    } catch (error) {
      console.error('Error analyzing receipt:', error);
      Alert.alert('Error', 'Failed to analyze receipt. Please try manual entry.');
    }
  };

  const handleSaveTransaction = async (transactionData: {
    amount: number;
    currency: string;
    category: string;
    type: 'income' | 'expense';
    description: string;
    date: string;
  }) => {
    try {
      const transaction = {
        id: Date.now().toString(),
        amount: transactionData.amount,
        description: transactionData.description,
        category: transactionData.category,
        type: transactionData.type,
        date: transactionData.date,
        currency: transactionData.currency || 'PKR',
        userId: user?.id || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await addTransaction(transaction);
      Alert.alert('Success', 'Transaction added successfully!');
      handleClose();
    } catch (error) {
      console.error('Error saving transaction:', error);
      Alert.alert('Error', 'Failed to save transaction. Please try again.');
    }
  };

  const handleClose = () => {
    setScannedImage(null);
    setReceiptData(null);
    setShowRawText(false);
    setManualData({
      amount: '',
      merchant: '',
      category: '',
      date: new Date().toISOString().split('T')[0],
    });
    setShowTransactionModal(false);
    onClose();
  };

  const retakePicture = () => {
    setScannedImage(null);
    setReceiptData(null);
    setShowRawText(false);
  };

  return (
    <Modal visible={isVisible} animationType="slide">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.title}>Receipt Scanner</Text>
          <View style={styles.placeholder} />
        </View>

        {!scannedImage ? (
          /* Upload View */
          <View style={styles.uploadContainer}>
            <View style={styles.uploadArea}>
              <CameraIcon size={64} color="#6B7280" />
              <Text style={styles.uploadTitle}>Scan Receipt</Text>
              <Text style={styles.uploadSubtitle}>
                Select a receipt image from your gallery to extract transaction details using real OCR
              </Text>
              
                      <View style={styles.demoNote}>
          <Text style={styles.demoNoteText}>
            🔍 Real OCR: Using Azure Computer Vision API for actual text extraction from your receipt images. Fallback to demo data if API is not configured.
          </Text>
        </View>

              <TouchableOpacity
                style={styles.uploadButton}
                onPress={pickImage}
                disabled={isScanning}
              >
                {isScanning ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <ImageIcon size={20} color="white" />
                    <Text style={styles.uploadButtonText}>Select Image</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* Results View */
          <ScrollView style={styles.resultsContainer}>
            <View style={styles.imageContainer}>
              <Image source={{ uri: scannedImage }} style={styles.scannedImage} />
              <TouchableOpacity style={styles.retakeButton} onPress={retakePicture}>
                <RotateCcw size={20} color="white" />
                <Text style={styles.retakeText}>Retake</Text>
              </TouchableOpacity>
            </View>

            {receiptData ? (
              <View style={styles.dataContainer}>
                <View style={styles.headerRow}>
                  <Text style={styles.sectionTitle}>Extracted Data</Text>
                  <TouchableOpacity 
                    style={styles.rawTextButton}
                    onPress={() => setShowRawText(!showRawText)}
                  >
                    <Eye size={16} color="#2563EB" />
                    <Text style={styles.rawTextButtonText}>
                      {showRawText ? 'Hide' : 'Show'} Raw Text
                    </Text>
                  </TouchableOpacity>
                </View>

                {showRawText && (
                  <View style={styles.rawTextContainer}>
                    <Text style={styles.rawTextLabel}>Raw OCR Text:</Text>
                    <Text style={styles.rawText}>{receiptData.rawText}</Text>
                  </View>
                )}
                
                <View style={styles.dataRow}>
                  <DollarSign size={20} color="#2563EB" />
                  <Text style={styles.dataLabel}>Amount:</Text>
                  <Text style={styles.dataValue}>
                    {receiptData.amount > 0 
                      ? ExchangeRateService.formatCurrency(receiptData.amount, 'PKR')
                      : 'Not detected'
                    }
                  </Text>
                </View>

                <View style={styles.dataRow}>
                  <FileText size={20} color="#2563EB" />
                  <Text style={styles.dataLabel}>Merchant:</Text>
                  <Text style={styles.dataValue}>{receiptData.merchant}</Text>
                </View>

                <View style={styles.dataRow}>
                  <Tag size={20} color="#2563EB" />
                  <Text style={styles.dataLabel}>Category:</Text>
                  <Text style={styles.dataValue}>{receiptData.category}</Text>
                </View>

                <View style={styles.dataRow}>
                  <Calendar size={20} color="#2563EB" />
                  <Text style={styles.dataLabel}>Date:</Text>
                  <Text style={styles.dataValue}>{receiptData.date}</Text>
                </View>

                {receiptData.items && receiptData.items.length > 0 && (
                  <View style={styles.itemsContainer}>
                    <Text style={styles.itemsLabel}>Detected Items:</Text>
                    {receiptData.items.map((item, index) => (
                      <Text key={index} style={styles.itemText}>• {item}</Text>
                    ))}
                  </View>
                )}

                <View style={styles.confidenceContainer}>
                  <Text style={styles.confidenceText}>
                    Confidence: {Math.round(receiptData.confidence * 100)}%
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => setShowTransactionModal(true)}
                >
                  <Text style={styles.editButtonText}>Edit & Save Transaction</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={styles.loadingText}>Analyzing receipt with OCR...</Text>
                <Text style={styles.loadingSubtext}>This may take a few seconds</Text>
              </View>
            )}
          </ScrollView>
        )}

        {/* Transaction Modal */}
        <TransactionModal
          visible={showTransactionModal}
          onClose={() => setShowTransactionModal(false)}
          onSave={handleSaveTransaction}
          initialData={receiptData ? {
            amount: receiptData.amount.toString(),
            description: receiptData.merchant,
            category: receiptData.category,
            date: receiptData.date,
            currency: 'PKR',
          } : undefined}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Theme.colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    minHeight: 60,
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily.bold,
  },
  placeholder: {
    width: 40,
  },
  webContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: Theme.colors.background,
  },
  webIcon: {
    marginBottom: 24,
  },
  webTitle: {
    fontSize: 24,
    color: Theme.colors.textPrimary,
    marginBottom: 16,
    fontFamily: Theme.typography.fontFamily.bold,
  },
  webText: {
    fontSize: 16,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    maxWidth: 400,
    fontFamily: Theme.typography.fontFamily.regular,
  },
  webButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  webButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: Theme.typography.fontFamily.semiBold,
  },
  uploadContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  uploadArea: {
    backgroundColor: Theme.colors.backgroundSecondary,
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    maxWidth: 400,
    width: '100%',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  uploadTitle: {
    fontSize: 24,
    color: Theme.colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
    fontFamily: Theme.typography.fontFamily.bold,
  },
  uploadSubtitle: {
    fontSize: 16,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    fontFamily: 'Inter-Regular',
  },
  uploadButton: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 8,
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  imageContainer: {
    position: 'relative',
    margin: 20,
  },
  scannedImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  retakeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  retakeText: {
    color: 'white',
    fontSize: 12,
    marginLeft: 4,
    fontFamily: 'Inter-Regular',
  },
  dataContainer: {
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily.bold,
  },
  rawTextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  rawTextButtonText: {
    color: Theme.colors.info,
    fontSize: 14,
    fontFamily: Theme.typography.fontFamily.medium,
    marginLeft: 4,
  },
  rawTextContainer: {
    backgroundColor: Theme.colors.backgroundSecondary,
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  rawTextLabel: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.fontFamily.regular,
    marginBottom: 8,
  },
  rawText: {
    fontSize: 14,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily.regular,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Theme.colors.backgroundSecondary,
    borderRadius: 16,
  },
  dataLabel: {
    fontSize: 16,
    color: Theme.colors.textSecondary,
    marginLeft: 12,
    flex: 1,
    fontFamily: Theme.typography.fontFamily.regular,
  },
  dataValue: {
    fontSize: 16,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily.semiBold,
  },
  itemsContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: Theme.colors.backgroundSecondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  itemsLabel: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.fontFamily.regular,
    marginBottom: 8,
  },
  itemText: {
    fontSize: 14,
    color: Theme.colors.textPrimary,
    fontFamily: Theme.typography.fontFamily.regular,
    marginBottom: 4,
  },
  confidenceContainer: {
    alignItems: 'center',
    marginVertical: 16,
    padding: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 16,
  },
  confidenceText: {
    fontSize: 14,
    color: Theme.colors.info,
    fontFamily: Theme.typography.fontFamily.medium,
  },
  editButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  editButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: Theme.typography.fontFamily.semiBold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: Theme.colors.textSecondary,
    marginTop: 16,
    fontFamily: Theme.typography.fontFamily.regular,
  },
  loadingSubtext: {
    fontSize: 14,
    color: Theme.colors.textTertiary,
    marginTop: 4,
    fontFamily: Theme.typography.fontFamily.regular,
  },
  demoNote: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: 12,
    borderRadius: 16,
    marginBottom: 20,
    alignSelf: 'center',
    maxWidth: 300,
  },
  demoNoteText: {
    fontSize: 14,
    color: Theme.colors.info,
    textAlign: 'center',
    fontFamily: Theme.typography.fontFamily.medium,
  },
});
