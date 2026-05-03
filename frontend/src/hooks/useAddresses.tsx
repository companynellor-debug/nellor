import { useState, useEffect } from 'react';

export interface Address {
  id: string;
  label: string;
  name: string;
  document: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
}

export const useAddresses = () => {
  const [addresses, setAddresses] = useState<Address[]>(() => {
    const saved = localStorage.getItem('user_addresses');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('user_addresses', JSON.stringify(addresses));
  }, [addresses]);

  const addAddress = (address: Omit<Address, 'id'>) => {
    const newAddress: Address = {
      ...address,
      id: Date.now().toString()
    };

    if (newAddress.isDefault) {
      setAddresses(prev => 
        [...prev.map(addr => ({ ...addr, isDefault: false })), newAddress]
      );
    } else {
      setAddresses(prev => [...prev, newAddress]);
    }

    return newAddress;
  };

  const updateAddress = (id: string, updates: Partial<Address>) => {
    setAddresses(prev => 
      prev.map(address => 
        address.id === id ? { ...address, ...updates } : address
      )
    );
  };

  const deleteAddress = (id: string) => {
    setAddresses(prev => prev.filter(address => address.id !== id));
  };

  const getDefaultAddress = () => {
    return addresses.find(address => address.isDefault);
  };

  const setDefaultAddress = (id: string) => {
    setAddresses(prev => 
      prev.map(address => ({
        ...address,
        isDefault: address.id === id
      }))
    );
  };

  return {
    addresses,
    addAddress,
    updateAddress,
    deleteAddress,
    getDefaultAddress,
    setDefaultAddress
  };
};
