import React, { useRef } from 'react';
import { List, Button, Dialog, Form, Input, ImageUploader, Toast, SwipeAction } from 'antd-mobile';
import { useChargingStore } from '../stores/chargingStore';
import type { Vehicle } from '../types';
import dayjs from 'dayjs';
import { resizeImage } from '../utils/imageUtils';

const VehicleManagement: React.FC = () => {
  const { vehicles, addVehicle, setDefaultVehicle, deleteVehicle, updateVehicle, loadVehicles } = useChargingStore();
  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const editingVehicleRef = useRef<Vehicle | null>(null);

  const handleAddVehicle = async (values: Partial<Vehicle>) => {
    try {
      if (!values.name) {
        Toast.show({
          content: '請填寫車輛名稱',
          position: 'bottom',
        });
        return;
      }

      const vehicleData: Omit<Vehicle, 'id'> = {
        name: values.name,
        licensePlate: values.licensePlate || '',
        brand: 'default',           // 提供默認值
        model: 'default',           // 提供默認值
        year: 2023,                 // 提供默認值
        batteryCapacity: 100,       // 提供默認值
        imageUrl: values.imageUrl && Array.isArray(values.imageUrl) && values.imageUrl.length > 0
          ? values.imageUrl[0].url
          : undefined,
        purchaseDate: values.purchaseDate,
        isDefault: false
      };

      await addVehicle(vehicleData);
      Toast.show({
        content: '新增車輛成功',
        position: 'bottom',
      });
      
      Dialog.clear();
    } catch (error) {
      console.error('Add vehicle failed:', error);
      Toast.show({
        content: '新增車輛失敗',
        position: 'bottom',
      });
    }
  };

  const handleDeleteVehicle = async (vehicle: Vehicle) => {
    Dialog.confirm({
      title: '確認？',
      content: vehicle.isDefault 
        ? `此車輛為預設車輛，刪除後將需要重新設定預設車輛。確定要刪除 ${vehicle.name} 嗎？`
        : `確定要刪除 ${vehicle.name} 嗎？`,
      onConfirm: async () => {
        try {
          await deleteVehicle(vehicle.id);
          await loadVehicles();
          Toast.show({
            content: '刪除成功',
            position: 'bottom',
          });
        } catch (error) {
          Toast.show({
            content: '刪除失敗',
            position: 'bottom',
          });
        }
      },
    });
  };

  const showAddVehicleDialog = () => {
    addForm.resetFields();
    const AddVehicleForm = () => (
      <Form
        form={addForm}
        layout='horizontal'
        onFinish={handleAddVehicle}
        initialValues={{
          purchaseDate: dayjs().format('YYYY-MM-DD'),
          licensePlate: '',
          brand: 'default',
          model: 'default',
          year: 2023,
          batteryCapacity: 100
        }}
        footer={
          <Button block type='submit' color='primary'>
            確認
          </Button>
        }
      >
        <Form.Item name='name' label='車輛名稱' rules={[{ required: true }]}>
          <Input placeholder='請輸入車輛名稱' />
        </Form.Item>

        <Form.Item name='licensePlate' label='車牌號碼'>
          <Input placeholder='請輸入車牌號碼' />
        </Form.Item>
        
        <Form.Item name='purchaseDate' label='購買日期'>
          <Input 
            type="date" 
            placeholder="購買日"
          />
        </Form.Item>

        <Form.Item name='imageUrl' label='車輛照片'>
          <ImageUploader
            maxCount={1}
            value={addForm.getFieldValue('imageUrl') || []}
            upload={async (file: File) => {
              try {
                const resizedImageUrl = await resizeImage(file);
                return { url: resizedImageUrl };
              } catch (error) {
                console.error('Image resize failed:', error);
                Toast.show({
                  content: '圖片處理失敗',
                  position: 'bottom',
                });
                throw error;
              }
            }}
          />
        </Form.Item>

        {/* 隱藏的必填欄位 */}
        <Form.Item name='brand' hidden>
          <Input />
        </Form.Item>
        <Form.Item name='model' hidden>
          <Input />
        </Form.Item>
        <Form.Item name='year' hidden>
          <Input type="number" />
        </Form.Item>
        <Form.Item name='batteryCapacity' hidden>
          <Input type="number" />
        </Form.Item>
      </Form>
    );

    Dialog.show({
      title: '新增車輛',
      content: <AddVehicleForm />,
      closeOnAction: true,
      closeOnMaskClick: true,
      onClose: () => {
        addForm.resetFields();
      },
    });
  };

  const handleEditVehicle = async (values: Partial<Vehicle>) => {
    const currentEditingVehicle = editingVehicleRef.current;
    if (!currentEditingVehicle) return;
    
    try {
      if (!values.name) {
        Toast.show({
          content: '請填寫車輛名稱',
          position: 'bottom',
        });
        return;
      }

      const imageUrl = values.imageUrl && Array.isArray(values.imageUrl) && values.imageUrl.length > 0
        ? values.imageUrl[0].url
        : currentEditingVehicle.imageUrl;

      const updatedVehicle: Partial<Vehicle> = {
        name: values.name,
        licensePlate: values.licensePlate || '',
        brand: currentEditingVehicle.brand,
        model: currentEditingVehicle.model,
        year: currentEditingVehicle.year,
        batteryCapacity: currentEditingVehicle.batteryCapacity,
        imageUrl: imageUrl,
        purchaseDate: values.purchaseDate,
        isDefault: currentEditingVehicle.isDefault,
      };

      await updateVehicle(currentEditingVehicle.id, updatedVehicle);
      Toast.show({
        content: '修改成功',
        position: 'bottom',
      });

      await loadVehicles();
      Dialog.clear();
      editForm.resetFields();
      editingVehicleRef.current = null;
    } catch (error) {
      console.error('Edit vehicle failed:', error);
      Toast.show({
        content: '修改失敗',
        position: 'bottom',
      });
    }
  };

  const showEditVehicleDialog = (vehicle: Vehicle) => {
    editingVehicleRef.current = vehicle;
    editForm.resetFields();
    editForm.setFieldsValue({
      name: vehicle.name,
      licensePlate: vehicle.licensePlate,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      batteryCapacity: vehicle.batteryCapacity,
      imageUrl: vehicle.imageUrl ? [{ url: vehicle.imageUrl }] : [],
      purchaseDate: vehicle.purchaseDate
    });
    
    const EditVehicleForm = () => (
      <Form
        form={editForm}
        layout='horizontal'
        onFinish={handleEditVehicle}
        initialValues={{
          name: vehicle.name,
          licensePlate: vehicle.licensePlate,
          brand: vehicle.brand,
          model: vehicle.model,
          year: vehicle.year,
          batteryCapacity: vehicle.batteryCapacity,
          imageUrl: vehicle.imageUrl ? [{ url: vehicle.imageUrl }] : [],
          purchaseDate: vehicle.purchaseDate
        }}
        footer={
          <Button block type='submit' color='primary'>
            確認
          </Button>
        }
      >
        <Form.Item name='name' label='車輛名稱' rules={[{ required: true }]}>
          <Input placeholder='請輸入車輛名稱' />
        </Form.Item>

        <Form.Item name='licensePlate' label='車牌號碼'>
          <Input placeholder='請輸入車牌號碼' />
        </Form.Item>
        
        <Form.Item name='purchaseDate' label='購買日期'>
          <Input 
            type="date" 
            placeholder="購買日"
          />
        </Form.Item>

        <Form.Item name='imageUrl' label='車輛照片'>
          <ImageUploader
            maxCount={1}
            value={editForm.getFieldValue('imageUrl') || []}
            upload={async (file: File) => {
              try {
                const resizedImageUrl = await resizeImage(file);
                return { url: resizedImageUrl };
              } catch (error) {
                console.error('Image resize failed:', error);
                Toast.show({
                  content: '圖片處理失敗',
                  position: 'bottom',
                });
                throw error;
              }
            }}
          />
        </Form.Item>

        {/* 隱藏的必填欄位 */}
        <Form.Item name='brand' hidden>
          <Input />
        </Form.Item>
        <Form.Item name='model' hidden>
          <Input />
        </Form.Item>
        <Form.Item name='year' hidden>
          <Input type="number" />
        </Form.Item>
        <Form.Item name='batteryCapacity' hidden>
          <Input type="number" />
        </Form.Item>
      </Form>
    );

    Dialog.show({
      title: '修改車輛',
      content: <EditVehicleForm />,
      closeOnAction: true,
      closeOnMaskClick: true,
      onClose: () => {
        editForm.resetFields();
        editingVehicleRef.current = null;
      },
    });
  };

  return (
    <List header='車輛管理'>
      {vehicles.map((vehicle) => (
        <SwipeAction
          key={vehicle.id}
          rightActions={[
            {
              key: 'edit',
              text: '修改',
              color: 'primary',
              onClick: () => showEditVehicleDialog(vehicle),
            },
            {
              key: 'delete',
              text: '刪除',
              color: 'danger',
              onClick: () => handleDeleteVehicle(vehicle),
            },
          ]}
        >
          <List.Item
            prefix={
              vehicle.imageUrl ? (
                <div className="vehicle-image">
                  <img
                    src={vehicle.imageUrl}
                    alt={vehicle.name}
                  />
                </div>
              ) : null
            }
            extra={
              <Button
                size='small'
                color={vehicle.isDefault ? 'default' : 'primary'}
                onClick={() => setDefaultVehicle(vehicle.id)}
              >
                {vehicle.isDefault ? '預設車輛' : '設為預設'}
              </Button>
            }
          >
            {vehicle.name}
          </List.Item>
        </SwipeAction>
      ))}
      <List.Item>
        <Button block onClick={showAddVehicleDialog}>
          新增車輛
        </Button>
      </List.Item>
    </List>
  );
};

export default VehicleManagement;
